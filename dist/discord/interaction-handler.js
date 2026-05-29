"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleInteraction = handleInteraction;
const discord_js_1 = require("discord.js");
const env_1 = require("../config/env");
const logger_1 = require("../lib/logger");
const money_1 = require("../lib/money");
const productService = __importStar(require("../services/product.service"));
const productTypeService = __importStar(require("../services/product-type.service"));
const orderService = __importStar(require("../services/order.service"));
const payment_service_1 = require("../services/payment.service");
const auditService = __importStar(require("../services/audit.service"));
const ticketService = __importStar(require("../services/ticket.service"));
const rate_limit_service_1 = require("../services/rate-limit.service");
const EMBED_COLORS = {
    info: 0x0b1f3a,
    success: 0x0f4d2f,
    danger: 0x4a0f0f,
    neutral: 0x000000,
};
const MENU_FOOTER = 'Desenvolvido por arezi_dev (https://gabriel-arezi.vercel.app)';
async function handleInteraction(interaction) {
    try {
        if (interaction.isChatInputCommand()) {
            await handleSlashCommand(interaction);
        }
        else if (interaction.isButton()) {
            await handleButtonInteraction(interaction);
        }
        else if (interaction.isModalSubmit && interaction.isModalSubmit()) {
            await handleModalSubmit(interaction);
        }
        else if (interaction.isStringSelectMenu && interaction.isStringSelectMenu()) {
            await handleSelectInteraction(interaction);
        }
    }
    catch (error) {
        logger_1.logger.error('Erro ao processar interação', error);
        await interaction.reply({
            content: '❌ Ocorreu um erro ao processar sua solicitação.',
            ephemeral: true,
        });
    }
}
async function handleSelectInteraction(interaction) {
    const customId = interaction.customId;
    if (customId === 'select_product') {
        const values = interaction.values;
        const productId = values && values.length ? values[0] : null;
        if (!productId) {
            await interaction.reply({ content: '❌ Produto inválido.', ephemeral: true });
            return;
        }
        const product = await productService.getProduct(productId);
        if (!product) {
            await interaction.reply({ content: '❌ Produto não encontrado.', ephemeral: true });
            return;
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(product.name)
            .setColor(EMBED_COLORS.info)
            .setDescription(product.description || 'Sem descrição')
            .addFields({ name: '💰 Preço', value: (0, money_1.formatMoney)(product.price), inline: true }, { name: '📦 Estoque', value: product.quantity.toString(), inline: true }, { name: '🏷️ Categoria', value: product.category, inline: true }, { name: '📊 Tipo', value: product.type, inline: true })
            .setTimestamp();
        if (product.imageUrl) {
            embed.setImage(product.imageUrl);
        }
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`buy_${product.id}`)
            .setLabel('Comprar Agora')
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId('back_to_menu')
            .setLabel('Voltar ao Menu')
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
    }
}
async function handleModalSubmit(interaction) {
    const customId = interaction.customId;
    if (customId.startsWith('confirm_cancel_order_')) {
        const orderId = customId.replace('confirm_cancel_order_', '');
        // Only admins can confirm cancellation
        if (!interaction.memberPermissions || !interaction.memberPermissions.has('Administrator')) {
            await interaction.reply({ content: '❌ Apenas administradores podem confirmar este cancelamento.', ephemeral: true });
            return;
        }
        const confirmation = (interaction.fields.getTextInputValue('confirm_text') || '').trim().toUpperCase();
        if (confirmation !== 'CONFIRMAR') {
            await interaction.reply({ content: 'Ação cancelada: texto de confirmação incorreto.', ephemeral: true });
            return;
        }
        try {
            const result = await ticketService.cancelDeliveryTicket(orderId, `${interaction.user.username}`);
            if (result) {
                await interaction.reply({ content: '✅ Pedido cancelado e ticket fechado.', ephemeral: true });
            }
            else {
                await interaction.reply({ content: '⚠️ Pedido cancelado, mas houve problemas ao fechar o ticket.', ephemeral: true });
            }
        }
        catch (err) {
            logger_1.logger.error('Erro ao processar confirmação de cancelamento', err);
            await interaction.reply({ content: '❌ Falha ao cancelar o pedido.', ephemeral: true });
        }
    }
}
async function handleSlashCommand(interaction) {
    const commandName = interaction.commandName;
    switch (commandName) {
        case 'menu':
            await handleMenuCommand(interaction);
            break;
        case 'menu-canal':
            await handleMenuCanalCommand(interaction);
            break;
        case 'comprar':
            await handleBuyCommand(interaction);
            break;
        case 'estoque':
            await handleStockCommand(interaction);
            break;
        case 'tipos':
            await handleTypesCommand(interaction);
            break;
        default:
            await interaction.reply({
                content: '❌ Comando não reconhecido.',
                ephemeral: true,
            });
    }
}
async function handleMenuCommand(interaction) {
    await interaction.deferReply();
    try {
        const products = await productService.listProducts(false);
        if (products.length === 0) {
            await interaction.editReply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setTitle('📭 Nenhum produto disponível no momento')
                        .setColor(EMBED_COLORS.danger)
                        .setTimestamp(),
                ],
            });
            return;
        }
        // Exibir welcome page com status resumido (sem contagem por tipo)
        const totalProducts = products.length;
        const availableProducts = products.filter((p) => p.quantity > 0).length;
        const outOfStock = totalProducts - availableProducts;
        const botAvatar = interaction.client?.user?.displayAvatarURL?.() ?? null;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🛒 Seja bem-vindo')
            .setColor(EMBED_COLORS.neutral)
            .setDescription('**Seja bem-vindo ao sistema de vendas**\n\nUse o menu abaixo para escolher um produto.')
            .setThumbnail(botAvatar)
            .addFields({ name: 'Total de produtos', value: String(totalProducts), inline: true }, { name: 'Disponíveis', value: String(availableProducts), inline: true }, { name: 'Fora de estoque', value: String(outOfStock), inline: true })
            .setFooter({ text: MENU_FOOTER })
            .setTimestamp();
        const embeds = [embed];
        // Select menu para escolher produtos (label = nome, description = preço | estoque)
        const selectOptions = products.map((product) => ({
            label: product.name.substring(0, 100),
            description: `${(0, money_1.formatMoney)(product.price)} | Estoque: ${product.quantity}`.substring(0, 100),
            value: product.id,
        }));
        const select = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('select_product')
            .setPlaceholder('Selecione um produto...')
            .addOptions(selectOptions)
            .setMinValues(1)
            .setMaxValues(1);
        const row = new discord_js_1.ActionRowBuilder().addComponents(select);
        await interaction.editReply({
            embeds,
            components: [row],
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao mostrar menu', error);
        await interaction.editReply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setTitle('❌ Erro ao carregar menu de produtos')
                    .setColor(EMBED_COLORS.danger)
                    .setTimestamp(),
            ],
        });
    }
}
async function handleMenuCanalCommand(interaction) {
    await interaction.deferReply();
    try {
        const channelId = interaction.channel?.id;
        if (!channelId) {
            await interaction.editReply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setTitle('❌ Comando deve ser usado em um canal de texto')
                        .setColor(EMBED_COLORS.danger)
                        .setTimestamp(),
                ],
            });
            return;
        }
        const products = await productService.listProductsByChannel(channelId, false);
        if (products.length === 0) {
            await interaction.editReply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setTitle('📭 Nenhum produto associado a este canal')
                        .setColor(EMBED_COLORS.danger)
                        .setTimestamp(),
                ],
            });
            return;
        }
        // Exibir welcome page para o canal com status resumido (sem contagem por tipo)
        const totalProducts = products.length;
        const availableProducts = products.filter((p) => p.quantity > 0).length;
        const outOfStock = totalProducts - availableProducts;
        const botAvatar = interaction.client?.user?.displayAvatarURL?.() ?? null;
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🛒 Seja bem-vindo')
            .setColor(EMBED_COLORS.neutral)
            .setDescription('**Seja bem-vindo ao sistema de vendas**\n\nUse o menu abaixo para escolher um produto.')
            .setThumbnail(botAvatar)
            .addFields({ name: 'Total de produtos', value: String(totalProducts), inline: true }, { name: 'Disponíveis', value: String(availableProducts), inline: true }, { name: 'Fora de estoque', value: String(outOfStock), inline: true })
            .setFooter({ text: MENU_FOOTER })
            .setTimestamp();
        const embeds = [embed];
        // Select menu para escolher produtos (label = nome, description = preço | estoque)
        const selectOptions = products.map((product) => ({
            label: product.name.substring(0, 100),
            description: `${(0, money_1.formatMoney)(product.price)} | Estoque: ${product.quantity}`.substring(0, 100),
            value: product.id,
        }));
        const select = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('select_product')
            .setPlaceholder('Selecione um produto...')
            .addOptions(selectOptions)
            .setMinValues(1)
            .setMaxValues(1);
        const row = new discord_js_1.ActionRowBuilder().addComponents(select);
        await interaction.editReply({
            embeds,
            components: [row],
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao mostrar menu do canal', error);
        await interaction.editReply({
            content: '❌ Erro ao carregar menu de produtos do canal.',
        });
    }
}
async function handleBuyCommand(interaction) {
    await interaction.deferReply({ ephemeral: true });
    try {
        // Rate limiting
        const { allowed, remainingTime } = await (0, rate_limit_service_1.checkRateLimit)(interaction.user.id, 'checkout');
        if (!allowed) {
            await interaction.editReply({
                content: `⏱️ Aguarde ${remainingTime}s antes de outro checkout.`,
            });
            return;
        }
        const productId = interaction.options.getString('id');
        if (!productId) {
            await interaction.editReply({
                content: '❌ ID do produto inválido.',
            });
            return;
        }
        const product = await productService.getProduct(productId);
        if (!product) {
            await interaction.editReply({
                content: '❌ Produto não encontrado.',
            });
            return;
        }
        if (product.quantity < 1) {
            await interaction.editReply({
                content: '❌ Produto fora de estoque.',
            });
            return;
        }
        // Criar pedido
        const order = await orderService.createOrder({
            discordUserId: interaction.user.id,
            discordUsername: interaction.user.username,
            productId,
            quantity: 1,
        });
        let paymentData = null;
        try {
            paymentData = await (0, payment_service_1.createPayment)({
                orderId: order.id,
                amount: Number(order.totalPrice),
                description: product.name,
            });
            await orderService.updateOrderStatus(order.id, 'PENDING', {
                paymentId: paymentData.id,
                paymentUrl: paymentData.payment_url,
                pixKey: paymentData.pix_key || env_1.config.payment.pixKey,
            });
        }
        catch (error) {
            logger_1.logger.warn('Falha ao gerar pagamento, seguindo com fallback de PIX', {
                orderId: order.id,
                error: error instanceof Error ? error.message : String(error),
            });
        }
        // Registrar auditoria
        await auditService.createAuditLog({
            discordUserId: interaction.user.id,
            discordUsername: interaction.user.username,
            action: 'PURCHASE',
            entity: 'ORDER',
            entityId: order.id,
            details: { productId, amount: order.totalPrice },
        });
        // Abrir a sala de atendimento assim que o checkout começa
        await ticketService.ensureDeliveryTicket(order.id, 'pending');
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('✅ Checkout Iniciado!')
            .setColor(0x00ff00)
            .addFields({ name: 'Produto', value: product.name, inline: true }, { name: 'Preço', value: (0, money_1.formatMoney)(order.totalPrice), inline: true }, { name: 'Pedido ID', value: order.id, inline: false }, {
            name: 'Pagamento via PIX',
            value: 'Use o botão **Pagar Agora** dentro do ticket para receber a chave PIX.',
            inline: false,
        })
            .setTimestamp();
        await interaction.editReply({
            embeds: [embed],
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao processar compra', error);
        await interaction.editReply({
            content: '❌ Erro ao processar compra.',
        });
    }
}
async function handleStockCommand(interaction) {
    // Verificar permissões
    if (!interaction.memberPermissions ||
        !interaction.memberPermissions.has('Administrator')) {
        await interaction.reply({
            content: '❌ Apenas administradores podem usar este comando.',
            ephemeral: true,
        });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    try {
        switch (subcommand) {
            case 'listar':
                await handleListProducts(interaction);
                break;
            case 'adicionar':
                await handleAddProduct(interaction);
                break;
            case 'editar':
                await handleEditProduct(interaction);
                break;
            case 'remover':
                await handleDeleteProduct(interaction);
                break;
            case 'quantidade':
                await handleUpdateQuantity(interaction);
                break;
            default:
                await interaction.editReply('❌ Subcomando não reconhecido.');
        }
    }
    catch (error) {
        logger_1.logger.error('Erro ao processar comando de estoque', error);
        await interaction.editReply({
            content: '❌ Erro ao processar comando.',
        });
    }
}
async function handleListProducts(interaction) {
    const includeInactive = interaction.options.getBoolean('todos') || false;
    const products = await productService.listProducts(includeInactive);
    if (products.length === 0) {
        await interaction.editReply({
            content: '📭 Nenhum produto encontrado.',
        });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('📋 Lista de Produtos')
        .setColor(EMBED_COLORS.info)
        .setTimestamp();
    const productTexts = products
        .slice(0, 25)
        .map((p) => `**${p.name}** (${p.id})\n` +
        `└ Preço: ${(0, money_1.formatMoney)(p.price)} | Estoque: ${p.quantity} | Status: ${p.status}`);
    embed.setDescription(productTexts.join('\n\n') || 'Nenhum produto');
    await interaction.editReply({
        embeds: [embed],
    });
}
async function handleAddProduct(interaction) {
    const nome = interaction.options.getString('nome');
    const preco = interaction.options.getNumber('preco');
    const quantidade = interaction.options.getInteger('quantidade');
    const categoria = interaction.options.getString('categoria');
    const tipo = interaction.options.getString('tipo') || 'DIGITAL';
    const canal = interaction.options.getChannel('canal');
    const descricao = interaction.options.getString('descricao');
    const imagem = interaction.options.getString('imagem');
    const video = interaction.options.getString('video');
    const product = await productService.createProduct({
        name: nome,
        price: preco,
        quantity: quantidade,
        category: categoria,
        type: tipo,
        channelId: canal?.id,
        description: descricao || undefined,
        imageUrl: imagem || undefined,
        videoUrl: video || undefined,
    });
    await auditService.createAuditLog({
        discordUserId: interaction.user.id,
        discordUsername: interaction.user.username,
        action: 'CREATE_PRODUCT',
        entity: 'PRODUCT',
        entityId: product.id,
    });
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('✅ Produto Adicionado')
        .setColor(EMBED_COLORS.success)
        .addFields({ name: 'Nome', value: product.name, inline: true }, { name: 'ID', value: `\`${product.id}\``, inline: true }, { name: 'Preço', value: (0, money_1.formatMoney)(product.price), inline: true }, { name: 'Estoque', value: product.quantity.toString(), inline: true }, { name: 'Categoria', value: product.category, inline: true }, { name: 'Tipo', value: product.type, inline: true })
        .setTimestamp();
    if (canal)
        embed.addFields({ name: '📢 Canal', value: `<#${canal.id}>`, inline: true });
    if (imagem)
        embed.addFields({ name: '🖼️', value: 'Imagem adicionada' });
    if (video)
        embed.addFields({ name: '🎬', value: 'Vídeo adicionado' });
    await interaction.editReply({
        embeds: [embed],
    });
}
async function handleEditProduct(interaction) {
    const id = interaction.options.getString('id');
    const nome = interaction.options.getString('nome');
    const preco = interaction.options.getNumber('preco');
    const categoria = interaction.options.getString('categoria');
    const tipo = interaction.options.getString('tipo');
    const canal = interaction.options.getChannel('canal');
    const status = interaction.options.getString('status');
    const descricao = interaction.options.getString('descricao');
    const imagem = interaction.options.getString('imagem');
    const video = interaction.options.getString('video');
    const updateData = {};
    if (nome)
        updateData.name = nome;
    if (preco)
        updateData.price = preco;
    if (categoria)
        updateData.category = categoria;
    if (tipo)
        updateData.type = tipo;
    if (canal)
        updateData.channelId = canal.id;
    if (status)
        updateData.status = status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
    if (descricao !== null)
        updateData.description = descricao;
    if (imagem !== null)
        updateData.imageUrl = imagem;
    if (video !== null)
        updateData.videoUrl = video;
    const product = await productService.updateProduct(id, updateData);
    await auditService.createAuditLog({
        discordUserId: interaction.user.id,
        discordUsername: interaction.user.username,
        action: 'UPDATE_PRODUCT',
        entity: 'PRODUCT',
        entityId: id,
        details: updateData,
    });
    await interaction.editReply({
        content: `✅ Produto **${product.name}** atualizado com sucesso!`,
    });
}
async function handleDeleteProduct(interaction) {
    const id = interaction.options.getString('id');
    const product = await productService.getProduct(id);
    if (!product) {
        await interaction.editReply({
            content: '❌ Produto não encontrado.',
        });
        return;
    }
    await productService.deleteProduct(id);
    await auditService.createAuditLog({
        discordUserId: interaction.user.id,
        discordUsername: interaction.user.username,
        action: 'DELETE_PRODUCT',
        entity: 'PRODUCT',
        entityId: id,
    });
    await interaction.editReply({
        content: `✅ Produto **${product.name}** removido com sucesso!`,
    });
}
async function handleUpdateQuantity(interaction) {
    const id = interaction.options.getString('id');
    const novaQuantidade = interaction.options.getInteger('quantidade');
    const product = await productService.updateProductQuantity(id, novaQuantidade);
    await auditService.createAuditLog({
        discordUserId: interaction.user.id,
        discordUsername: interaction.user.username,
        action: 'UPDATE_QUANTITY',
        entity: 'PRODUCT',
        entityId: id,
        details: { novaQuantidade },
    });
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('✅ Estoque Atualizado')
        .setColor(EMBED_COLORS.success)
        .addFields({ name: 'Produto', value: product.name, inline: false }, { name: 'Nova Quantidade', value: novaQuantidade.toString(), inline: true })
        .setTimestamp();
    await interaction.editReply({
        embeds: [embed],
    });
}
async function handleButtonInteraction(interaction) {
    const customId = interaction.customId;
    if (customId.startsWith('product_detail_')) {
        const productId = customId.replace('product_detail_', '');
        const product = await productService.getProduct(productId);
        if (!product) {
            await interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setTitle('❌ Produto não encontrado')
                        .setColor(EMBED_COLORS.danger)
                        .setTimestamp(),
                ],
                ephemeral: true,
            });
            return;
        }
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(product.name)
            .setColor(EMBED_COLORS.info)
            .setDescription(product.description || 'Sem descrição')
            .addFields({ name: '💰 Preço', value: (0, money_1.formatMoney)(product.price), inline: true }, { name: '📦 Estoque', value: product.quantity.toString(), inline: true }, { name: '🏷️ Categoria', value: product.category, inline: true }, { name: '📊 Tipo', value: product.type, inline: true })
            .setTimestamp();
        if (product.imageUrl) {
            embed.setImage(product.imageUrl);
        }
        const buttons = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`buy_${product.id}`)
            .setLabel('Comprar Agora')
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId('back_to_menu')
            .setLabel('Voltar ao Menu')
            .setStyle(discord_js_1.ButtonStyle.Secondary));
        await interaction.reply({
            embeds: [embed],
            components: [buttons],
            ephemeral: true,
        });
    }
    else if (customId.startsWith('buy_')) {
        const productId = customId.replace('buy_', '');
        const { allowed, remainingTime } = await (0, rate_limit_service_1.checkRateLimit)(interaction.user.id, 'checkout');
        if (!allowed) {
            await interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setTitle('⏱️ Aguarde antes de outro checkout')
                        .setColor(EMBED_COLORS.danger)
                        .setDescription(`Aguarde ${remainingTime}s antes de outro checkout.`)
                        .setTimestamp(),
                ],
                ephemeral: true,
            });
            return;
        }
        const product = await productService.getProduct(productId);
        if (!product || product.quantity < 1) {
            await interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setTitle('❌ Produto fora de estoque')
                        .setColor(EMBED_COLORS.danger)
                        .setTimestamp(),
                ],
                ephemeral: true,
            });
            return;
        }
        const order = await orderService.createOrder({
            discordUserId: interaction.user.id,
            discordUsername: interaction.user.username,
            productId,
            quantity: 1,
        });
        await auditService.createAuditLog({
            discordUserId: interaction.user.id,
            discordUsername: interaction.user.username,
            action: 'PURCHASE',
            entity: 'ORDER',
            entityId: order.id,
        });
        await ticketService.ensureDeliveryTicket(order.id, 'pending');
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('✅ Checkout Iniciado!')
            .setColor(EMBED_COLORS.success)
            .addFields({ name: 'Produto', value: product.name, inline: true }, { name: 'Preço', value: (0, money_1.formatMoney)(order.totalPrice), inline: true }, { name: 'Pedido ID', value: order.id, inline: false }, {
            name: 'Pagamento via PIX',
            value: 'Use o botão **Pagar Agora** dentro do ticket para receber a chave PIX.',
            inline: false,
        })
            .setTimestamp();
        await interaction.reply({
            embeds: [embed],
            ephemeral: true,
        });
    }
    else if (customId === 'back_to_menu') {
        // Re-enviar o menu
        const products = await productService.listProducts(false);
        // Recriar select menu com os produtos
        const selectOptions = products.map((product) => ({
            label: product.name.substring(0, 100),
            description: `${(0, money_1.formatMoney)(product.price)} | Estoque: ${product.quantity}`.substring(0, 100),
            value: product.id,
        }));
        const select = new discord_js_1.StringSelectMenuBuilder()
            .setCustomId('select_product')
            .setPlaceholder('Selecione um produto...')
            .addOptions(selectOptions)
            .setMinValues(1)
            .setMaxValues(1);
        const row = new discord_js_1.ActionRowBuilder().addComponents(select);
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle('🛒 Seja bem-vindo')
            .setColor(EMBED_COLORS.neutral)
            .setDescription('**Seja bem-vindo ao sistema de vendas**\n\nUse o menu abaixo para escolher um produto.')
            .setFooter({ text: MENU_FOOTER })
            .setTimestamp();
        await interaction.reply({ embeds: [embed], components: [row] });
    }
    else if (customId.startsWith('ticket_buy_')) {
        const orderId = customId.replace('ticket_buy_', '');
        const order = await orderService.getOrder(orderId);
        if (!order) {
            await interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setTitle('❌ Pedido não encontrado')
                        .setColor(EMBED_COLORS.danger)
                        .setTimestamp(),
                ],
                ephemeral: true,
            });
            return;
        }
        if (order.status === 'COMPLETED') {
            await interaction.reply({
                embeds: [
                    new discord_js_1.EmbedBuilder()
                        .setTitle('✅ Este pedido já foi pago')
                        .setColor(EMBED_COLORS.success)
                        .setDescription('Aguarde um administrador concluir a entrega.')
                        .setTimestamp(),
                ],
                ephemeral: true,
            });
            return;
        }
        const pixKey = order.pixKey || env_1.config.payment.pixKey || 'Será informada em breve';
        await interaction.reply({
            embeds: [
                new discord_js_1.EmbedBuilder()
                    .setTitle('💳 Pagamento via PIX')
                    .setColor(EMBED_COLORS.danger)
                    .addFields({ name: 'Chave PIX', value: `\`${pixKey}\`` })
                    .setDescription('**Favor mandar comprovante do pagamento neste ticket**')
                    .setTimestamp(),
            ],
            ephemeral: true,
        });
    }
    else if (customId.startsWith('admin_close_ticket_')) {
        const orderId = customId.replace('admin_close_ticket_', '');
        if (!interaction.memberPermissions || !interaction.memberPermissions.has('Administrator')) {
            await interaction.reply({ content: '❌ Apenas administradores podem usar este botão.', ephemeral: true });
            return;
        }
        try {
            const closed = await ticketService.closeDeliveryTicket(orderId, `${interaction.user.username}`);
            if (closed) {
                await interaction.reply({ content: '🔒 Ticket fechado e canal arquivado (somente leitura).', ephemeral: true });
            }
            else {
                await interaction.reply({ content: '⚠️ Ticket marcado como fechado, porém houve problemas ao arquivar o canal.', ephemeral: true });
            }
        }
        catch (err) {
            logger_1.logger.error('Erro ao fechar ticket via botão admin', err);
            await interaction.reply({ content: '❌ Falha ao fechar o ticket.', ephemeral: true });
        }
    }
    else if (customId.startsWith('admin_cancel_order_')) {
        const orderId = customId.replace('admin_cancel_order_', '');
        if (!interaction.memberPermissions || !interaction.memberPermissions.has('Administrator')) {
            await interaction.reply({ content: '❌ Apenas administradores podem usar este botão.', ephemeral: true });
            return;
        }
        // Mostrar modal de confirmação
        try {
            const modal = new discord_js_1.ModalBuilder()
                .setCustomId(`confirm_cancel_order_${orderId}`)
                .setTitle('Confirmar cancelamento');
            const input = new discord_js_1.TextInputBuilder()
                .setCustomId('confirm_text')
                .setLabel('Digite CONFIRMAR para cancelar o pedido')
                .setStyle(discord_js_1.TextInputStyle.Short)
                .setPlaceholder('CONFIRMAR')
                .setRequired(true);
            const row = new discord_js_1.ActionRowBuilder().addComponents(input);
            modal.addComponents(row);
            await interaction.showModal(modal);
        }
        catch (err) {
            logger_1.logger.error('Erro ao abrir modal de confirmação', err);
            await interaction.reply({ content: '❌ Não foi possível abrir o modal de confirmação.', ephemeral: true });
        }
    }
}
async function handleTypesCommand(interaction) {
    // Verificar permissões
    if (!interaction.memberPermissions ||
        !interaction.memberPermissions.has('Administrator')) {
        await interaction.reply({
            content: '❌ Apenas administradores podem usar este comando.',
            ephemeral: true,
        });
        return;
    }
    await interaction.deferReply({ ephemeral: true });
    const subcommand = interaction.options.getSubcommand();
    try {
        switch (subcommand) {
            case 'listar':
                await handleListTypes(interaction);
                break;
            case 'criar':
                await handleCreateType(interaction);
                break;
            case 'deletar':
                await handleDeleteType(interaction);
                break;
            case 'editar':
                await handleEditType(interaction);
                break;
        }
    }
    catch (error) {
        logger_1.logger.error('Erro ao processar comando de tipos', error);
        await interaction.editReply({
            content: '❌ Erro ao processar comando.',
        });
    }
}
async function handleListTypes(interaction) {
    const types = await productTypeService.listProductTypes();
    if (types.length === 0) {
        await interaction.editReply({
            content: '📭 Nenhum tipo de produto cadastrado.',
        });
        return;
    }
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('📋 Tipos de Produtos')
        .setColor(EMBED_COLORS.info)
        .setTimestamp();
    const typeTexts = types.map((t) => `${t.emoji || '📦'} **${t.name}**\n` +
        (t.description ? `└ ${t.description}` : ''));
    embed.setDescription(typeTexts.join('\n\n') || 'Nenhum tipo');
    await interaction.editReply({
        embeds: [embed],
    });
}
async function handleCreateType(interaction) {
    const nome = interaction.options.getString('nome');
    const descricao = interaction.options.getString('descricao');
    const emoji = interaction.options.getString('emoji');
    const type = await productTypeService.createProductType({
        name: nome,
        description: descricao || undefined,
        emoji: emoji || undefined,
    });
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('✅ Tipo de Produto Criado')
        .setColor(EMBED_COLORS.success)
        .addFields({ name: 'Nome', value: type.name, inline: true }, { name: 'Emoji', value: type.emoji || 'N/A', inline: true })
        .setTimestamp();
    if (type.description) {
        embed.addFields({ name: 'Descrição', value: type.description });
    }
    await interaction.editReply({
        embeds: [embed],
    });
}
async function handleDeleteType(interaction) {
    const nome = interaction.options.getString('nome');
    const type = await productTypeService.deleteProductType(nome);
    await interaction.editReply({
        content: `✅ Tipo de produto **${type.name}** removido com sucesso!`,
    });
}
async function handleEditType(interaction) {
    const nome = interaction.options.getString('nome');
    const novoNome = interaction.options.getString('novo_nome');
    const descricao = interaction.options.getString('descricao');
    const emoji = interaction.options.getString('emoji');
    const type = await productTypeService.updateProductType(nome, {
        newName: novoNome || undefined,
        description: descricao || undefined,
        emoji: emoji || undefined,
    });
    await auditService.createAuditLog({
        discordUserId: interaction.user.id,
        discordUsername: interaction.user.username,
        action: 'UPDATE_PRODUCT_TYPE',
        entity: 'PRODUCT_TYPE',
        entityId: type.name,
        details: { oldName: nome, newName: novoNome, description: descricao, emoji: emoji },
    });
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle('✅ Tipo de Produto Atualizado')
        .setColor(EMBED_COLORS.success)
        .addFields({ name: 'Nome', value: type.name, inline: true }, { name: 'Emoji', value: type.emoji || 'N/A', inline: true })
        .setTimestamp();
    if (type.description) {
        embed.addFields({ name: 'Descrição', value: type.description });
    }
    await interaction.editReply({
        embeds: [embed],
    });
}
//# sourceMappingURL=interaction-handler.js.map