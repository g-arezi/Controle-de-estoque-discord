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
            .setStyle(discord_js_1.ButtonStyle.Success)),
    ];
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
        const ticketChannel = (await rest.post(discord_js_1.Routes.guildChannels(env_1.config.discord.guildId), {
            body: {
                name: buildTicketChannelName(orderId),
                type: discord_js_1.ChannelType.GuildText,
                topic: `Ticket de entrega do pedido ${orderId}`,
                permission_overwrites: [
                    {
                        id: env_1.config.discord.guildId,
                        deny: ticketPermissions,
                    },
                    {
                        id: order.discordUserId,
                        allow: ticketPermissions,
                    },
                ],
            },
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