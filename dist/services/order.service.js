"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createOrder = createOrder;
exports.getOrder = getOrder;
exports.updateOrderStatus = updateOrderStatus;
exports.listUserOrders = listUserOrders;
exports.cancelExpiredOrders = cancelExpiredOrders;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../lib/logger");
async function createOrder(data) {
    const quantity = data.quantity || 1;
    try {
        return await prisma_1.prisma.$transaction(async (tx) => {
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
            logger_1.logger.info('Pedido criado', {
                orderId: order.id,
                userId: data.discordUserId,
                productId: data.productId,
            });
            return order;
        }, {
            isolationLevel: 'Serializable',
            timeout: 10000,
        });
    }
    catch (error) {
        logger_1.logger.error('Erro ao criar pedido', error);
        throw error;
    }
}
async function getOrder(orderId) {
    try {
        const order = await prisma_1.prisma.order.findUnique({
            where: { id: orderId },
            include: { product: true },
        });
        return order;
    }
    catch (error) {
        logger_1.logger.error('Erro ao buscar pedido', error);
        throw error;
    }
}
async function updateOrderStatus(orderId, status, additionalData) {
    try {
        const order = await prisma_1.prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                ...(status === 'COMPLETED' && { completedAt: new Date() }),
                ...additionalData,
            },
            include: { product: true },
        });
        logger_1.logger.info('Status do pedido atualizado', {
            orderId,
            newStatus: status,
        });
        return order;
    }
    catch (error) {
        logger_1.logger.error('Erro ao atualizar pedido', error);
        throw error;
    }
}
async function listUserOrders(discordUserId) {
    try {
        const orders = await prisma_1.prisma.order.findMany({
            where: { discordUserId },
            include: { product: true },
            orderBy: { createdAt: 'desc' },
        });
        return orders;
    }
    catch (error) {
        logger_1.logger.error('Erro ao listar pedidos do usuário', error);
        throw error;
    }
}
async function cancelExpiredOrders() {
    try {
        const now = new Date();
        const expiredOrders = await prisma_1.prisma.order.findMany({
            where: {
                status: 'PENDING',
                expiresAt: {
                    lt: now,
                },
            },
        });
        for (const order of expiredOrders) {
            // Retorna estoque
            await prisma_1.prisma.product.update({
                where: { id: order.productId },
                data: { quantity: { increment: order.quantity } },
            });
            // Marca como expirado
            await updateOrderStatus(order.id, 'EXPIRED');
        }
        if (expiredOrders.length > 0) {
            logger_1.logger.info('Pedidos expirados cancelados', {
                count: expiredOrders.length,
            });
        }
        return expiredOrders;
    }
    catch (error) {
        logger_1.logger.error('Erro ao cancelar pedidos expirados', error);
        throw error;
    }
}
//# sourceMappingURL=order.service.js.map