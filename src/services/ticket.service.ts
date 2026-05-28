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
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`admin_close_ticket_${orderId}`)
        .setLabel('Fechar Ticket')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId(`admin_cancel_order_${orderId}`)
        .setLabel('Cancelar Pedido')
        .setStyle(ButtonStyle.Danger)
    ),
  ];
}

export async function closeDeliveryTicket(orderId: string, actor?: string) {
  try {
    const rest = new REST({ version: '10' }).setToken(config.discord.token);
    const order = await orderService.getOrder(orderId);

    const channels = (await rest.get(Routes.guildChannels(config.discord.guildId))) as Array<{
      id: string;
      name: string;
      topic?: string | null;
      type: number;
    }>;

    const existingChannel = channels.find(
      (channel) => channel.type === ChannelType.GuildText && channel.topic?.includes(orderId)
    );

    if (!existingChannel) {
      logger.warn('Canal do ticket não encontrado para fechar', { orderId });
      return false;
    }

    try {
      await rest.post(Routes.channelMessages(existingChannel.id), {
        body: {
          content: `🔒 Ticket fechado pelo administrador${actor ? ` (${actor})` : ''}`,
        },
      });

        // Remover cargo temporário do usuário, se existir
        try {
          await removeTempRoleForTicket(rest, orderId, order?.discordUserId);
        } catch (remErr: any) {
          logger.warn('Erro ao remover cargo temporário ao fechar ticket', { orderId, error: remErr?.message || String(remErr) });
        }

      const newName = existingChannel.name?.startsWith('fechado-') ? existingChannel.name : `fechado-${existingChannel.name}`;
      const newTopic = (existingChannel.topic || '') + ' - FECHADO';

      try {
        await rest.patch(Routes.channel(existingChannel.id), {
          body: {
            name: newName,
            topic: newTopic,
          },
        });
      } catch (patchErr: any) {
        logger.warn('Falha ao renomear/atualizar tópico do canal ao arquivar ticket', { orderId, channelId: existingChannel.id, error: patchErr?.message || String(patchErr) });
      }

      // Tenta aplicar overwrite de permissão para tornar somente leitura; não falhará o fluxo se der erro
      try {
        const denySend = new PermissionsBitField([PermissionFlagsBits.SendMessages]).bitfield.toString();

        // Negar envio para @everyone (guildId) e para o usuário do pedido, quando disponível
        await rest.put(
          `/channels/${existingChannel.id}/permissions/${config.discord.guildId}`,
          {
            body: {
              deny: denySend,
              allow: '0',
              type: 0,
            },
          }
        );

        if (order?.discordUserId) {
          await rest.put(
            `/channels/${existingChannel.id}/permissions/${order.discordUserId}`,
            {
              body: {
                deny: denySend,
                allow: '0',
                type: 1,
              },
            }
          );
        }
      } catch (permErr: any) {
        logger.warn('Falha ao atualizar permissões do canal ao arquivar ticket (pode ser falta de permissão)', { orderId, channelId: existingChannel.id, error: permErr?.message || String(permErr) });
      }

      logger.info('Ticket fechado e canal arquivado (somente leitura)', { orderId, channelId: existingChannel.id, actor });
      return true;
    } catch (error: any) {
      logger.error('Falha ao fechar ticket (post/patch)', { orderId, error: error?.message || String(error) });
      return false;
    }
  } catch (err: any) {
    logger.error('Erro ao buscar canais para fechar ticket', { orderId, error: err?.message || String(err) });
    return false;
  }
}

export async function cancelDeliveryTicket(orderId: string, actor?: string) {
  try {
    const order = await orderService.getOrder(orderId);
    if (!order) {
      logger.warn('Pedido não encontrado ao tentar cancelar', { orderId });

      // Mesmo que o pedido não exista no banco, tentar ao menos remover o canal/thread
      try {
        const restFallback = new REST({ version: '10' }).setToken(config.discord.token);
        const channelsFallback = (await restFallback.get(Routes.guildChannels(config.discord.guildId))) as Array<{
          id: string;
          name: string;
          topic?: string | null;
          type: number;
        }>;

        const existingChannelFallback = channelsFallback.find(
          (channel) => channel.type === ChannelType.GuildText && channel.topic?.includes(orderId)
        );

        if (existingChannelFallback) {
          try {
            await restFallback.post(Routes.channelMessages(existingChannelFallback.id), {
              body: {
                content: `❌ Pedido cancelado pelo administrador${actor ? ` (${actor})` : ''}`,
              },
            });
          } catch (errMsg: any) {
            logger.warn('Falha ao notificar canal do ticket (pedido não encontrado)', { orderId, channelId: existingChannelFallback.id, error: errMsg?.message || String(errMsg) });
          }

          try {
            await restFallback.delete(Routes.channel(existingChannelFallback.id));
            logger.info('Canal do ticket removido apesar de pedido inexistente', { orderId, channelId: existingChannelFallback.id, actor });
          } catch (delErr: any) {
            logger.warn('Falha ao deletar canal do ticket (pedido não encontrado, possivelmente falta de permissão)', { orderId, channelId: existingChannelFallback.id, error: delErr?.message || String(delErr) });
          }
        }
      } catch (errFallback: any) {
        logger.error('Erro ao tentar remover canal do ticket para pedido inexistente', { orderId, error: errFallback?.message || String(errFallback) });
      }

      return false;
    }

    // Repor estoque
    try {
      const productServiceModule = await import('./product.service');
      const currentProduct = await productServiceModule.getProduct(order.productId);
      const newQuantity = (currentProduct?.quantity || 0) + order.quantity;
      await productServiceModule.updateProductQuantity(order.productId, newQuantity);
    } catch (err) {
      logger.error('Erro ao repor estoque ao cancelar pedido', { orderId, error: String(err) });
    }

    try {
      await orderService.updateOrderStatus(orderId, 'CANCELLED');
    } catch (err) {
      logger.error('Erro ao atualizar status do pedido para CANCELLED', { orderId, error: String(err) });
      // Continuar com o fluxo de notificação mesmo que a atualização tenha falhado
    }

    try {
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
        try {
          await rest.post(Routes.channelMessages(existingChannel.id), {
            body: {
              content: `❌ Pedido cancelado pelo administrador${actor ? ` (${actor})` : ''}`,
            },
          });

          // Remover cargo temporário do usuário, se existir
          try {
            await removeTempRoleForTicket(rest, orderId, order.discordUserId);
          } catch (remErr: any) {
            logger.warn('Erro ao remover cargo temporário ao cancelar pedido', { orderId, error: remErr?.message || String(remErr) });
          }

          try {
            await rest.delete(Routes.channel(existingChannel.id));
          } catch (delErr: any) {
            logger.warn('Falha ao deletar canal do ticket ao cancelar pedido (pode ser falta de permissão)', { orderId, channelId: existingChannel.id, error: delErr?.message || String(delErr) });
          }
        } catch (err: any) {
          logger.error('Erro ao notificar canal do ticket ao cancelar pedido', { orderId, error: err?.message || String(err) });
        }
      }
    } catch (err: any) {
      logger.error('Erro ao buscar canais para notificar cancelamento', { orderId, error: err?.message || String(err) });
    }

    logger.info('Pedido cancelado pelo administrador', { orderId, actor });
    return true;
  } catch (err: any) {
    logger.error('Erro inesperado ao cancelar pedido', { orderId, error: err?.message || String(err) });
    return false;
  }
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

async function createTempRoleForTicket(rest: REST, orderId: string, userId?: string) {
  if (!userId) return null;

  const roleName = `ticket-viewer-${orderId.slice(-8).toUpperCase()}`;

  try {
    const role = (await rest.post(Routes.guildRoles(config.discord.guildId), {
      body: {
        name: roleName,
        permissions: '0',
        mentionable: false,
      },
    })) as { id: string; name: string };

    // Assign role to the user
    try {
      await rest.put(`/guilds/${config.discord.guildId}/members/${userId}/roles/${role.id}`, {});
    } catch (assignErr: any) {
      logger.warn('Falha ao atribuir cargo temporário ao usuário do ticket', { orderId, userId, error: assignErr?.message || String(assignErr) });
    }

    return role;
  } catch (err: any) {
    logger.warn('Falha ao criar cargo temporário para ticket', { orderId, error: err?.message || String(err) });
    return null;
  }
}

async function removeTempRoleForTicket(rest: REST, orderId: string, userId?: string) {
  if (!userId) return;

  try {
    const roles = (await rest.get(Routes.guildRoles(config.discord.guildId))) as Array<{ id: string; name: string }>;
    const role = roles.find((r) => r.name === `ticket-viewer-${orderId.slice(-8).toUpperCase()}`);
    if (!role) return;

    try {
      await rest.delete(`/guilds/${config.discord.guildId}/members/${userId}/roles/${role.id}`);
    } catch (remErr: any) {
      logger.warn('Falha ao remover cargo temporário do usuário', { orderId, userId, roleId: role.id, error: remErr?.message || String(remErr) });
    }

    try {
      await rest.delete(`/guilds/${config.discord.guildId}/roles/${role.id}`);
    } catch (delErr: any) {
      logger.warn('Falha ao deletar cargo temporário do ticket', { orderId, roleId: role.id, error: delErr?.message || String(delErr) });
    }
  } catch (err: any) {
    logger.warn('Erro buscando cargos do servidor para remover cargo temporário', { orderId, error: err?.message || String(err) });
  }
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

    // Se for chamado no fluxo de checkout (pending), cria um cargo temporário para o usuário
    let tempRole: { id: string; name: string } | null = null;
    if (stage === 'pending') {
      tempRole = await createTempRoleForTicket(rest, orderId, order.discordUserId);
    }

    // Monta overwrites; se houver cargo temporário, usa ele para permitir apenas visualização
    const denyEveryoneView = new PermissionsBitField([PermissionFlagsBits.ViewChannel]).bitfield.toString();
    const allowRoleView = new PermissionsBitField([PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]).bitfield.toString();
    const denyRoleSend = new PermissionsBitField([PermissionFlagsBits.SendMessages]).bitfield.toString();

    const permissionOverwrites: Array<any> = [];

    // Negar view para @everyone
    permissionOverwrites.push({ id: config.discord.guildId, deny: denyEveryoneView });

    if (tempRole) {
      // Permissões do cargo temporário: ver e ler histórico, mas não enviar mensagens
      permissionOverwrites.push({ id: tempRole.id, allow: allowRoleView, deny: denyRoleSend, type: 0 });
    } else {
      // Fallback: permitir explicitamente para o usuário
      permissionOverwrites.push({ id: order.discordUserId, allow: ticketPermissions, type: 1 });
    }

    // Verifica se a categoria configurada existe e é do tipo Category antes de usar como parent
    const category = config.discord.ticketCategoryId
      ? (channels.find((c) => c.id === config.discord.ticketCategoryId && c.type === ChannelType.GuildCategory) as any)
      : null;

    if (config.discord.ticketCategoryId && !category) {
      logger.warn('TICKET_CATEGORY_ID configurado, mas não é uma categoria válida no servidor; criando canal sem parent', {
        ticketCategoryId: config.discord.ticketCategoryId,
        orderId,
      });
    }

    const createBody: any = {
      name: buildTicketChannelName(orderId),
      type: ChannelType.GuildText,
      topic: `Ticket de entrega do pedido ${orderId}`,
      permission_overwrites: permissionOverwrites,
    };

    if (category) {
      createBody.parent_id = config.discord.ticketCategoryId;
    }

    const ticketChannel = (await rest.post(Routes.guildChannels(config.discord.guildId), {
      body: createBody,
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