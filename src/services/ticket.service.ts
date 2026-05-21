import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  PermissionsBitField,
  REST,
  Routes,
} from 'discord.js';
import { config } from '../config/env';
import { logger } from '../lib/logger';
import * as orderService from './order.service';

type TicketStage = 'pending' | 'completed';

function buildTicketChannelName(orderId: string): string {
  return `pedido-${orderId.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toLowerCase()}`;
}

function buildTicketMessage(
  order: Awaited<ReturnType<typeof orderService.getOrder>>,
  stage: TicketStage
): string {
  if (!order) {
    return 'Pedido não encontrado.';
  }

  const header =
    stage === 'completed'
      ? '✅ **Pagamento aprovado. Ticket de entrega aberto.**'
      : '🛒 **Checkout iniciado. Sala de atendimento aberta.**';

  const footer =
    stage === 'completed'
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

function buildTicketComponents(stage: TicketStage, orderId: string) {
  if (stage !== 'pending') {
    return [];
  }

  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`ticket_buy_${orderId}`)
        .setLabel('Pagar Agora')
        .setStyle(ButtonStyle.Success)
    ),
  ];
}

async function notifyAdmins(rest: REST, order: Awaited<ReturnType<typeof orderService.getOrder>>) {
  if (!order) {
    return;
  }

  if (!config.discord.estoqueChannelId) {
    return;
  }

  await rest.post(Routes.channelMessages(config.discord.estoqueChannelId), {
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
export async function ensureDeliveryTicket(orderId: string, stage: TicketStage = 'completed') {
  if (!config.discord.guildId) {
    logger.warn('Guild ID não configurado; ticket do pedido não será criado', { orderId });
    return null;
  }

  const order = await orderService.getOrder(orderId);

  if (!order) {
    throw new Error(`Pedido "${orderId}" não encontrado para criar ticket`);
  }

  const shouldNotifyAdmins = stage === 'completed';

  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  const channels = (await rest.get(Routes.guildChannels(config.discord.guildId))) as Array<{
    id: string;
    name: string;
    topic?: string | null;
    type: number;
  }>;

  const existingChannel = channels.find(
    (channel) => channel.type === ChannelType.GuildText && channel.topic?.includes(orderId)
  );

  if (existingChannel) {
    logger.info('Ticket de entrega já existente, reutilizando canal', {
      orderId,
      channelId: existingChannel.id,
    });

    if (stage === 'completed') {
      await rest.post(Routes.channelMessages(existingChannel.id), {
        body: {
          content: buildTicketMessage(order, stage),
          allowed_mentions: {
            users: [order.discordUserId],
          },
        },
      });

      await notifyAdmins(rest, order);

      logger.info('Ticket do pedido atualizado para pagamento aprovado', {
        orderId,
        channelId: existingChannel.id,
        userId: order.discordUserId,
      });
    }

    return existingChannel;
  }

  try {
    // Tenta criar um novo canal privado
    const ticketPermissions = new PermissionsBitField([
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
    ]).bitfield.toString();

    const ticketChannel = (await rest.post(Routes.guildChannels(config.discord.guildId), {
      body: {
        name: buildTicketChannelName(orderId),
        type: ChannelType.GuildText,
        topic: `Ticket de entrega do pedido ${orderId}`,
        permission_overwrites: [
          {
            id: config.discord.guildId,
            deny: ticketPermissions,
          },
          {
            id: order.discordUserId,
            allow: ticketPermissions,
          },
        ],
      },
    })) as { id: string; name: string };

    await rest.post(Routes.channelMessages(ticketChannel.id), {
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

    logger.info('Ticket do pedido criado (canal)', {
      orderId,
      channelId: ticketChannel.id,
      userId: order.discordUserId,
      stage,
    });

    return ticketChannel;
  } catch (error: any) {
    // Se falhar por falta de permissão, cria uma thread no canal de estoque como fallback
    if (error?.code === 50013 && config.discord.estoqueChannelId) {
      logger.warn(
        'Falha ao criar canal (Missing Permissions); usando thread no canal de estoque como fallback',
        { orderId, error: error.message }
      );

      try {
        const threadName = `Entrega - Pedido ${orderId.slice(-8).toUpperCase()}`;
        const ticketThread = (await rest.post(
          `/channels/${config.discord.estoqueChannelId}/threads`,
          {
            body: {
              name: threadName,
              type: 11, // ChannelType.PrivateThread
              invitable: false,
            },
          }
        )) as { id: string; name: string };

        // Adiciona o cliente à thread
        await rest.put(
          `/channels/${config.discord.estoqueChannelId}/thread-members/${ticketThread.id}/${order.discordUserId}`,
          {}
        );

        await rest.post(Routes.channelMessages(ticketThread.id), {
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

        logger.info('Ticket do pedido criado (thread)', {
          orderId,
          threadId: ticketThread.id,
          parentChannelId: config.discord.estoqueChannelId,
          userId: order.discordUserId,
          stage,
        });

        return ticketThread;
      } catch (threadError: any) {
        logger.error('Falha ao criar thread de entrega', {
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