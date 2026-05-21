import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
import { logger } from '../lib/logger';
import { decreaseProductQuantity } from './product.service';

export interface CreateOrderInput {
  discordUserId: string;
  discordUsername: string;
  productId: string;
  quantity?: number;
}

export async function createOrder(data: CreateOrderInput) {
  const quantity = data.quantity || 1;

  try {
    return await prisma.$transaction(
      async (tx: any) => {
        // Busca o produto
        const product = await tx.product.findUnique({
          where: { id: data.productId },
        });

        if (!product) {
          throw new Error('Produto não encontrado');
        }

        if (product.quantity < quantity) {
          throw new Error('Estoque insuficiente');
        }

        // Cria o pedido
        const order = await tx.order.create({
          data: {
            discordUserId: data.discordUserId,
            discordUsername: data.discordUsername,
            productId: data.productId,
            quantity,
            totalPrice: product.price * quantity,
            status: 'PENDING',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
          },
        });

        // Diminui estoque
        await tx.product.update({
          where: { id: data.productId },
          data: { quantity: { decrement: quantity } },
        });

        logger.info('Pedido criado', {
          orderId: order.id,
          userId: data.discordUserId,
          productId: data.productId,
        });

        return order;
      },
      {
        isolationLevel: 'Serializable',
        timeout: 10000,
      }
    );
  } catch (error) {
    logger.error('Erro ao criar pedido', error);
    throw error;
  }
}

export async function getOrder(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    });

    return order;
  } catch (error) {
    logger.error('Erro ao buscar pedido', error);
    throw error;
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  additionalData?: {
    paymentId?: string;
    paymentUrl?: string;
    pixKey?: string;
  }
) {
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
        ...additionalData,
      },
      include: { product: true },
    });

    logger.info('Status do pedido atualizado', {
      orderId,
      newStatus: status as string,
    });

    return order;
  } catch (error) {
    logger.error('Erro ao atualizar pedido', error);
    throw error;
  }
}

export async function listUserOrders(discordUserId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { discordUserId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders;
  } catch (error) {
    logger.error('Erro ao listar pedidos do usuário', error);
    throw error;
  }
}

export async function cancelExpiredOrders() {
  try {
    const now = new Date();

    const expiredOrders = await prisma.order.findMany({
      where: {
        status: 'PENDING' as any,
        expiresAt: {
          lt: now,
        },
      },
    });

    for (const order of expiredOrders) {
      // Retorna estoque
      await prisma.product.update({
        where: { id: order.productId },
        data: { quantity: { increment: order.quantity } },
      });

      // Marca como expirado
      await updateOrderStatus(order.id, 'EXPIRED');
    }

    if (expiredOrders.length > 0) {
      logger.info('Pedidos expirados cancelados', {
        count: expiredOrders.length,
      });
    }

    return expiredOrders;
  } catch (error) {
    logger.error('Erro ao cancelar pedidos expirados', error);
    throw error;
  }
}
