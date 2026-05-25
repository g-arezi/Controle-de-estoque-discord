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
const auditService = __importStar(require("../services/audit.service"));
const ticketService = __importStar(require("../services/ticket.service"));
const rate_limit_service_1 = require("../services/rate-limit.service");
const EMBED_COLORS = {
    info: 0x0b1f3a,
    success: 0x0f4d2f,
    danger: 0x4a0f0f,
    neutral: 0x000000,
};
async function handleInteraction(interaction) {
    try {
        if (interaction.isChatInputCommand()) {
            await handleSlashCommand(interaction);
        }
        else if (interaction.isButton()) {
            await handleButtonInteraction(interaction);
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
        const embeds = [];
        const maxItemsPerEmbed = 5;
        for (let i = 0; i < products.length; i += maxItemsPerEmbed) {
            const pageProducts = products.slice(i, i + maxItemsPerEmbed);
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('🛍️ Menu de Produtos')
                .setColor(EMBED_COLORS.neutral)
                .setDescription(`Página ${Math.floor(i / maxItemsPerEmbed) + 1}`)
                .setTimestamp();
            pageProducts.forEach((product) => {
                embed.addFields({
                    name: `${product.name} (${product.id})`,
                    value: `💰 ${(0, money_1.formatMoney)(product.price)} | 📦 ${product.quantity} em estoque`,
                    inline: false,
                });
            });
            embeds.push(embed);
        }
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
        // Substituir o conteúdo do embed por um resumo de status
        const totalProducts = products.length;
        const availableProducts = products.filter((p) => p.quantity > 0).length;
        const outOfStock = totalProducts - availableProducts;
        const typeCounts = {};
        products.forEach((p) => {
            const t = p.type || 'Sem tipo';
            typeCounts[t] = (typeCounts[t] || 0) + 1;
        });
        const statusEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('🛍️ Status do Catálogo')
            .setColor(EMBED_COLORS.neutral)
            .addFields({ name: 'Total de produtos', value: String(totalProducts), inline: true }, { name: 'Disponíveis', value: String(availableProducts), inline: true }, { name: 'Fora de estoque', value: String(outOfStock), inline: true }, { name: 'Tipos de produto', value: String(Object.keys(typeCounts).length), inline: true }, { name: 'Contagem por tipo', value: Object.entries(typeCounts).map(([k, v]) => `${k}: ${v}`).join('\n') || 'Nenhum', inline: false })
            .setTimestamp();
        await interaction.editReply({
            embeds: [statusEmbed],
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
        const embeds = [];
        const maxItemsPerEmbed = 5;
        for (let i = 0; i < products.length; i += maxItemsPerEmbed) {
            const pageProducts = products.slice(i, i + maxItemsPerEmbed);
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('🛍️ Menu de Produtos')
                .setColor(EMBED_COLORS.neutral)
                .setDescription(`Página ${Math.floor(i / maxItemsPerEmbed) + 1}`)
                .setTimestamp();
            pageProducts.forEach((product) => {
                embed.addFields({
                    name: `${product.name} (${product.id})`,
                    value: `💰 ${(0, money_1.formatMoney)(product.price)} | 📦 ${product.quantity} em estoque | ${product.type}`,
                    inline: false,
                });
            });
            embeds.push(embed);
        }
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
        // Substituir o conteúdo do embed por um resumo de status (canal)
        const totalProducts = products.length;
        const availableProducts = products.filter((p) => p.quantity > 0).length;
        const outOfStock = totalProducts - availableProducts;
        const typeCounts = {};
        products.forEach((p) => {
            const t = p.type || 'Sem tipo';
            typeCounts[t] = (typeCounts[t] || 0) + 1;
        });
        const statusEmbed = new discord_js_1.EmbedBuilder()
            .setTitle('🛍️ Status do Catálogo (Canal)')
            .setColor(EMBED_COLORS.neutral)
            .addFields({ name: 'Total de produtos', value: String(totalProducts), inline: true }, { name: 'Disponíveis', value: String(availableProducts), inline: true }, { name: 'Fora de estoque', value: String(outOfStock), inline: true }, { name: 'Tipos de produto', value: String(Object.keys(typeCounts).length), inline: true }, { name: 'Contagem por tipo', value: Object.entries(typeCounts).map(([k, v]) => `${k}: ${v}`).join('\n') || 'Nenhum', inline: false })
            .setTimestamp();
        await interaction.editReply({
            embeds: [statusEmbed],
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
        // Recriar select menu com os produtos
        const products = await productService.listProducts(false);
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
        await interaction.reply({ embeds: [], components: [row], ephemeral: true });
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
        const pixKey = env_1.config.payment.pixKey || 'Será informada em breve';
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