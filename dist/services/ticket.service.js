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
exports.closeDeliveryTicket = closeDeliveryTicket;
exports.cancelDeliveryTicket = cancelDeliveryTicket;
exports.ensureDeliveryTicket = ensureDeliveryTicket;
const discord_js_1 = require("discord.js");
const env_1 = require("../config/env");
const logger_1 = require("../lib/logger");
const orderService = __importStar(require("./order.service"));
function buildTicketChannelName(orderId) {
    return `pedido-${orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toLowerCase()}`;
}
function buildTicketMessage(order, stage) {
    if (!order) {
        return 'Pedido não encontrado.';
    }
    const header = stage === 'completed'
        ? '✅ **Pagamento aprovado. Ticket de entrega aberto.**'
        : '🛒 **Checkout iniciado. Sala de atendimento aberta.**';
    const footer = stage === 'completed'
        ? 'Administradores, sigam com a entrega do produto.'
        : 'Aguarde a confirmação do pagamento. Administradores podem acompanhar por aqui.';
    const productDescription = order.product.description?.trim() || 'Sem descrição';
    return [
        header,
        '',
        `Cliente: <@${order.discordUserId}>`,
        `Pedido: **${order.id}**`,
        `ID: **${order.id}**`,
        `Produto: **${order.product.name}**`,
        `Descrição: ${productDescription}`,
        `Tipo: **${order.product.type}**`,
        `Quantidade: **${order.quantity}**`,
        `Categoria: **${order.product.category}**`,
        `Total: **R$ ${Number(order.totalPrice).toFixed(2)}**`,
        '',
        footer,
    ].join('\n');
}
function buildTicketComponents(stage, orderId) {
    if (stage !== 'pending') {
        return [];
    }
    return [
        new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
            .setCustomId(`ticket_buy_${orderId}`)
            .setLabel('Pagar Agora')
            .setStyle(discord_js_1.ButtonStyle.Success), new discord_js_1.ButtonBuilder()
            .setCustomId(`admin_close_ticket_${orderId}`)
            .setLabel('Fechar Ticket')
            .setStyle(discord_js_1.ButtonStyle.Secondary), new discord_js_1.ButtonBuilder()
            .setCustomId(`admin_cancel_order_${orderId}`)
            .setLabel('Cancelar Pedido')
            .setStyle(discord_js_1.ButtonStyle.Danger)),
    ];
}
async function closeDeliveryTicket(orderId, actor) {
    try {
        const rest = new discord_js_1.REST({ version: '10' }).setToken(env_1.config.discord.token);
        const order = await orderService.getOrder(orderId);
        const channels = (await rest.get(discord_js_1.Routes.guildChannels(env_1.config.discord.guildId)));
        const existingChannel = channels.find((channel) => channel.type === discord_js_1.ChannelType.GuildText && channel.topic?.includes(orderId));
        if (!existingChannel) {
            logger_1.logger.warn('Canal do ticket não encontrado para fechar', { orderId });
            return false;
        }
        try {
            await rest.post(discord_js_1.Routes.channelMessages(existingChannel.id), {
                body: {
                    content: `🔒 Ticket fechado pelo administrador${actor ? ` (${actor})` : ''}`,
                },
            });
            // Remover cargo temporário do usuário, se existir
            try {
                await removeTempRoleForTicket(rest, orderId, order?.discordUserId);
            }
            catch (remErr) {
                logger_1.logger.warn('Erro ao remover cargo temporário ao fechar ticket', { orderId, error: remErr?.message || String(remErr) });
            }
            const newName = existingChannel.name?.startsWith('fechado-') ? existingChannel.name : `fechado-${existingChannel.name}`;
            const newTopic = (existingChannel.topic || '') + ' - FECHADO';
            try {
                await rest.patch(discord_js_1.Routes.channel(existingChannel.id), {
                    body: {
                        name: newName,
                        topic: newTopic,
                    },
                });
            }
            catch (patchErr) {
                logger_1.logger.warn('Falha ao renomear/atualizar tópico do canal ao arquivar ticket', { orderId, channelId: existingChannel.id, error: patchErr?.message || String(patchErr) });
            }
            // Tenta aplicar overwrite de permissão para tornar somente leitura; não falhará o fluxo se der erro
            try {
                const denySend = new discord_js_1.PermissionsBitField([discord_js_1.PermissionFlagsBits.SendMessages]).bitfield.toString();
                // Negar envio para @everyone (guildId) e para o usuário do pedido, quando disponível
                await rest.put(`/channels/${existingChannel.id}/permissions/${env_1.config.discord.guildId}`, {
                    body: {
                        deny: denySend,
                        allow: '0',
                        type: 0,
                    },
                });
                if (order?.discordUserId) {
                    await rest.put(`/channels/${existingChannel.id}/permissions/${order.discordUserId}`, {
                        body: {
                            deny: denySend,
                            allow: '0',
                            type: 1,
                        },
                    });
                }
            }
            catch (permErr) {
                logger_1.logger.warn('Falha ao atualizar permissões do canal ao arquivar ticket (pode ser falta de permissão)', { orderId, channelId: existingChannel.id, error: permErr?.message || String(permErr) });
            }
            logger_1.logger.info('Ticket fechado e canal arquivado (somente leitura)', { orderId, channelId: existingChannel.id, actor });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Falha ao fechar ticket (post/patch)', { orderId, error: error?.message || String(error) });
            return false;
        }
    }
    catch (err) {
        logger_1.logger.error('Erro ao buscar canais para fechar ticket', { orderId, error: err?.message || String(err) });
        return false;
    }
}
async function cancelDeliveryTicket(orderId, actor) {
    try {
        const order = await orderService.getOrder(orderId);
        if (!order) {
            logger_1.logger.warn('Pedido não encontrado ao tentar cancelar', { orderId });
            return false;
        }
        // Repor estoque
        try {
            const productServiceModule = await Promise.resolve().then(() => __importStar(require('./product.service')));
            const currentProduct = await productServiceModule.getProduct(order.productId);
            const newQuantity = (currentProduct?.quantity || 0) + order.quantity;
            await productServiceModule.updateProductQuantity(order.productId, newQuantity);
        }
        catch (err) {
            logger_1.logger.error('Erro ao repor estoque ao cancelar pedido', { orderId, error: String(err) });
        }
        try {
            await orderService.updateOrderStatus(orderId, 'CANCELLED');
        }
        catch (err) {
            logger_1.logger.error('Erro ao atualizar status do pedido para CANCELLED', { orderId, error: String(err) });
            // Continuar com o fluxo de notificação mesmo que a atualização tenha falhado
        }
        try {
            const rest = new discord_js_1.REST({ version: '10' }).setToken(env_1.config.discord.token);
            const channels = (await rest.get(discord_js_1.Routes.guildChannels(env_1.config.discord.guildId)));
            const existingChannel = channels.find((channel) => channel.type === discord_js_1.ChannelType.GuildText && channel.topic?.includes(orderId));
            if (existingChannel) {
                try {
                    await rest.post(discord_js_1.Routes.channelMessages(existingChannel.id), {
                        body: {
                            content: `❌ Pedido cancelado pelo administrador${actor ? ` (${actor})` : ''}`,
                        },
                    });
                    // Remover cargo temporário do usuário, se existir
                    try {
                        await removeTempRoleForTicket(rest, orderId, order.discordUserId);
                    }
                    catch (remErr) {
                        logger_1.logger.warn('Erro ao remover cargo temporário ao cancelar pedido', { orderId, error: remErr?.message || String(remErr) });
                    }
                    try {
                        await rest.delete(discord_js_1.Routes.channel(existingChannel.id));
                    }
                    catch (delErr) {
                        logger_1.logger.warn('Falha ao deletar canal do ticket ao cancelar pedido (pode ser falta de permissão)', { orderId, channelId: existingChannel.id, error: delErr?.message || String(delErr) });
                    }
                }
                catch (err) {
                    logger_1.logger.error('Erro ao notificar canal do ticket ao cancelar pedido', { orderId, error: err?.message || String(err) });
                }
            }
        }
        catch (err) {
            logger_1.logger.error('Erro ao buscar canais para notificar cancelamento', { orderId, error: err?.message || String(err) });
        }
        logger_1.logger.info('Pedido cancelado pelo administrador', { orderId, actor });
        return true;
    }
    catch (err) {
        logger_1.logger.error('Erro inesperado ao cancelar pedido', { orderId, error: err?.message || String(err) });
        return false;
    }
}
async function notifyAdmins(rest, order) {
    if (!order) {
        return;
    }
    if (!env_1.config.discord.estoqueChannelId) {
        return;
    }
    await rest.post(discord_js_1.Routes.channelMessages(env_1.config.discord.estoqueChannelId), {
        body: {
            content: [
                '✅ Pagamento aprovado e ticket de entrega aberto.',
                `Pedido: **${order.id}**`,
                `Cliente: <@${order.discordUserId}>`,
                `Produto: **${order.product.name}**`,
            ].join('\n'),
            allowed_mentions: {
                users: [order.discordUserId],
            },
        },
    });
}
async function createTempRoleForTicket(rest, orderId, userId) {
    if (!userId)
        return null;
    const roleName = `ticket-viewer-${orderId.slice(-8).toUpperCase()}`;
    try {
        const role = (await rest.post(discord_js_1.Routes.guildRoles(env_1.config.discord.guildId), {
            body: {
                name: roleName,
                permissions: '0',
                mentionable: false,
            },
        }));
        // Assign role to the user
        try {
            await rest.put(`/guilds/${env_1.config.discord.guildId}/members/${userId}/roles/${role.id}`, {});
        }
        catch (assignErr) {
            logger_1.logger.warn('Falha ao atribuir cargo temporário ao usuário do ticket', { orderId, userId, error: assignErr?.message || String(assignErr) });
        }
        return role;
    }
    catch (err) {
        logger_1.logger.warn('Falha ao criar cargo temporário para ticket', { orderId, error: err?.message || String(err) });
        return null;
    }
}
async function removeTempRoleForTicket(rest, orderId, userId) {
    if (!userId)
        return;
    try {
        const roles = (await rest.get(discord_js_1.Routes.guildRoles(env_1.config.discord.guildId)));
        const role = roles.find((r) => r.name === `ticket-viewer-${orderId.slice(-8).toUpperCase()}`);
        if (!role)
            return;
        try {
            await rest.delete(`/guilds/${env_1.config.discord.guildId}/members/${userId}/roles/${role.id}`);
        }
        catch (remErr) {
            logger_1.logger.warn('Falha ao remover cargo temporário do usuário', { orderId, userId, roleId: role.id, error: remErr?.message || String(remErr) });
        }
        try {
            await rest.delete(`/guilds/${env_1.config.discord.guildId}/roles/${role.id}`);
        }
        catch (delErr) {
            logger_1.logger.warn('Falha ao deletar cargo temporário do ticket', { orderId, roleId: role.id, error: delErr?.message || String(delErr) });
        }
    }
    catch (err) {
        logger_1.logger.warn('Erro buscando cargos do servidor para remover cargo temporário', { orderId, error: err?.message || String(err) });
    }
}
/**
 * Cria ou reaproveita um canal/thread privado do pedido.
 * No início do checkout, abre a sala para o cliente e para a administração.
 * Quando o pagamento é aprovado, reaproveita a mesma sala para a entrega.
 */
async function ensureDeliveryTicket(orderId, stage = 'completed') {
    if (!env_1.config.discord.guildId) {
        logger_1.logger.warn('Guild ID não configurado; ticket do pedido não será criado', { orderId });
        return null;
    }
    const order = await orderService.getOrder(orderId);
    if (!order) {
        throw new Error(`Pedido "${orderId}" não encontrado para criar ticket`);
    }
    const shouldNotifyAdmins = stage === 'completed';
    const rest = new discord_js_1.REST({ version: '10' }).setToken(env_1.config.discord.token);
    const channels = (await rest.get(discord_js_1.Routes.guildChannels(env_1.config.discord.guildId)));
    const existingChannel = channels.find((channel) => channel.type === discord_js_1.ChannelType.GuildText && channel.topic?.includes(orderId));
    if (existingChannel) {
        logger_1.logger.info('Ticket de entrega já existente, reutilizando canal', {
            orderId,
            channelId: existingChannel.id,
        });
        if (stage === 'completed') {
            await rest.post(discord_js_1.Routes.channelMessages(existingChannel.id), {
                body: {
                    content: buildTicketMessage(order, stage),
                    allowed_mentions: {
                        users: [order.discordUserId],
                    },
                },
            });
            await notifyAdmins(rest, order);
            logger_1.logger.info('Ticket do pedido atualizado para pagamento aprovado', {
                orderId,
                channelId: existingChannel.id,
                userId: order.discordUserId,
            });
        }
        return existingChannel;
    }
    try {
        // Tenta criar um novo canal privado
        const ticketPermissions = new discord_js_1.PermissionsBitField([
            discord_js_1.PermissionFlagsBits.ViewChannel,
            discord_js_1.PermissionFlagsBits.SendMessages,
            discord_js_1.PermissionFlagsBits.ReadMessageHistory,
        ]).bitfield.toString();
        // Se for chamado no fluxo de checkout (pending), cria um cargo temporário para o usuário
        let tempRole = null;
        if (stage === 'pending') {
            tempRole = await createTempRoleForTicket(rest, orderId, order.discordUserId);
        }
        // Monta overwrites; se houver cargo temporário, usa ele para permitir apenas visualização
        const denyEveryoneView = new discord_js_1.PermissionsBitField([discord_js_1.PermissionFlagsBits.ViewChannel]).bitfield.toString();
        const allowRoleView = new discord_js_1.PermissionsBitField([discord_js_1.PermissionFlagsBits.ViewChannel, discord_js_1.PermissionFlagsBits.ReadMessageHistory]).bitfield.toString();
        const denyRoleSend = new discord_js_1.PermissionsBitField([discord_js_1.PermissionFlagsBits.SendMessages]).bitfield.toString();
        const permissionOverwrites = [];
        // Negar view para @everyone
        permissionOverwrites.push({ id: env_1.config.discord.guildId, deny: denyEveryoneView });
        if (tempRole) {
            // Permissões do cargo temporário: ver e ler histórico, mas não enviar mensagens
            permissionOverwrites.push({ id: tempRole.id, allow: allowRoleView, deny: denyRoleSend, type: 0 });
        }
        else {
            // Fallback: permitir explicitamente para o usuário
            permissionOverwrites.push({ id: order.discordUserId, allow: ticketPermissions, type: 1 });
        }
        // Verifica se a categoria configurada existe e é do tipo Category antes de usar como parent
        const category = env_1.config.discord.ticketCategoryId
            ? channels.find((c) => c.id === env_1.config.discord.ticketCategoryId && c.type === discord_js_1.ChannelType.GuildCategory)
            : null;
        if (env_1.config.discord.ticketCategoryId && !category) {
            logger_1.logger.warn('TICKET_CATEGORY_ID configurado, mas não é uma categoria válida no servidor; criando canal sem parent', {
                ticketCategoryId: env_1.config.discord.ticketCategoryId,
                orderId,
            });
        }
        const createBody = {
            name: buildTicketChannelName(orderId),
            type: discord_js_1.ChannelType.GuildText,
            topic: `Ticket de entrega do pedido ${orderId}`,
            permission_overwrites: permissionOverwrites,
        };
        if (category) {
            createBody.parent_id = env_1.config.discord.ticketCategoryId;
        }
        const ticketChannel = (await rest.post(discord_js_1.Routes.guildChannels(env_1.config.discord.guildId), {
            body: createBody,
        }));
        await rest.post(discord_js_1.Routes.channelMessages(ticketChannel.id), {
            body: {
                content: buildTicketMessage(order, stage),
                components: buildTicketComponents(stage, order.id),
                allowed_mentions: {
                    users: [order.discordUserId],
                },
            },
        });
        if (shouldNotifyAdmins) {
            await notifyAdmins(rest, order);
        }
        logger_1.logger.info('Ticket do pedido criado (canal)', {
            orderId,
            channelId: ticketChannel.id,
            userId: order.discordUserId,
            stage,
        });
        return ticketChannel;
    }
    catch (error) {
        // Se falhar por falta de permissão, cria uma thread no canal de estoque como fallback
        if (error?.code === 50013 && env_1.config.discord.estoqueChannelId) {
            logger_1.logger.warn('Falha ao criar canal (Missing Permissions); usando thread no canal de estoque como fallback', { orderId, error: error.message });
            try {
                const threadName = `Entrega - Pedido ${orderId.slice(-8).toUpperCase()}`;
                const ticketThread = (await rest.post(`/channels/${env_1.config.discord.estoqueChannelId}/threads`, {
                    body: {
                        name: threadName,
                        type: 11, // ChannelType.PrivateThread
                        invitable: false,
                    },
                }));
                // Adiciona o cliente à thread
                await rest.put(`/channels/${env_1.config.discord.estoqueChannelId}/thread-members/${ticketThread.id}/${order.discordUserId}`, {});
                await rest.post(discord_js_1.Routes.channelMessages(ticketThread.id), {
                    body: {
                        content: buildTicketMessage(order, stage),
                        components: buildTicketComponents(stage, order.id),
                        allowed_mentions: {
                            users: [order.discordUserId],
                        },
                    },
                });
                if (shouldNotifyAdmins) {
                    await notifyAdmins(rest, order);
                }
                logger_1.logger.info('Ticket do pedido criado (thread)', {
                    orderId,
                    threadId: ticketThread.id,
                    parentChannelId: env_1.config.discord.estoqueChannelId,
                    userId: order.discordUserId,
                    stage,
                });
                return ticketThread;
            }
            catch (threadError) {
                logger_1.logger.error('Falha ao criar thread de entrega', {
                    orderId,
                    error: threadError?.message || String(threadError),
                });
                throw threadError;
            }
        }
        // Relança o erro se não for Missing Permissions
        throw error;
    }
}
//# sourceMappingURL=ticket.service.js.map