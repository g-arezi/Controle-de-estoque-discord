"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProduct = createProduct;
exports.updateProduct = updateProduct;
exports.listProductsByChannel = listProductsByChannel;
exports.getProduct = getProduct;
exports.listProducts = listProducts;
exports.deleteProduct = deleteProduct;
exports.updateProductQuantity = updateProductQuantity;
exports.decreaseProductQuantity = decreaseProductQuantity;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../lib/logger");
async function createProduct(data) {
    try {
        const product = await prisma_1.prisma.product.create({
            data: {
                name: data.name,
                price: data.price,
                quantity: data.quantity,
                category: data.category,
                type: (data.type || 'DIGITAL'),
                channelId: data.channelId || null,
                description: data.description,
                imageUrl: data.imageUrl,
                videoUrl: data.videoUrl,
                status: 'ACTIVE',
            },
        });
        logger_1.logger.info('Produto criado', {
            productId: product.id,
            name: product.name,
            channelId: product.channelId,
        });
        return product;
    }
    catch (error) {
        logger_1.logger.error('Erro ao criar produto', error);
        throw error;
    }
}
async function updateProduct(productId, data) {
    try {
        const product = await prisma_1.prisma.product.update({
            where: { id: productId },
            data,
        });
        logger_1.logger.info('Produto atualizado', {
            productId,
            changes: data,
        });
        return product;
    }
    catch (error) {
        logger_1.logger.error('Erro ao atualizar produto', error);
        throw error;
    }
}
/**
 * Lista produtos de um canal específico
 */
async function listProductsByChannel(channelId, includeInactive = false) {
    try {
        const where = {
            channelId,
        };
        if (!includeInactive) {
            where.status = 'ACTIVE';
        }
        const products = await prisma_1.prisma.product.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return products;
    }
    catch (error) {
        logger_1.logger.error('Erro ao listar produtos por canal', error);
        throw error;
    }
}
async function getProduct(productId) {
    try {
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: productId },
        });
        return product;
    }
    catch (error) {
        logger_1.logger.error('Erro ao buscar produto', error);
        throw error;
    }
}
async function listProducts(includeInactive = false) {
    try {
        const products = await prisma_1.prisma.product.findMany({
            where: includeInactive
                ? {}
                : { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
        });
        return products;
    }
    catch (error) {
        logger_1.logger.error('Erro ao listar produtos', error);
        throw error;
    }
}
async function deleteProduct(productId) {
    try {
        await prisma_1.prisma.product.delete({
            where: { id: productId },
        });
        logger_1.logger.info('Produto deletado', { productId });
    }
    catch (error) {
        logger_1.logger.error('Erro ao deletar produto', error);
        throw error;
    }
}
async function updateProductQuantity(productId, newQuantity) {
    try {
        const product = await prisma_1.prisma.product.update({
            where: { id: productId },
            data: { quantity: newQuantity },
        });
        logger_1.logger.info('Estoque atualizado', {
            productId,
            newQuantity,
        });
        return product;
    }
    catch (error) {
        logger_1.logger.error('Erro ao atualizar estoque', error);
        throw error;
    }
}
async function decreaseProductQuantity(productId, amount) {
    try {
        const product = await prisma_1.prisma.product.update({
            where: { id: productId },
            data: { quantity: { decrement: amount } },
        });
        return product;
    }
    catch (error) {
        logger_1.logger.error('Erro ao diminuir estoque', error);
        throw error;
    }
}
//# sourceMappingURL=product.service.js.map