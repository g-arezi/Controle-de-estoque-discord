"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listProductTypes = listProductTypes;
exports.createProductType = createProductType;
exports.deleteProductType = deleteProductType;
exports.updateProductType = updateProductType;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../lib/logger");
/**
 * Lista todos os tipos de produtos
 */
async function listProductTypes() {
    try {
        const types = await prisma_1.prisma.productTypeConfig.findMany({
            orderBy: { createdAt: 'asc' },
        });
        return types;
    }
    catch (error) {
        logger_1.logger.error('Erro ao listar tipos de produtos', error);
        throw error;
    }
}
/**
 * Cria um novo tipo de produto
 */
async function createProductType(data) {
    try {
        // Verifica se tipo já existe
        const existing = await prisma_1.prisma.productTypeConfig.findUnique({
            where: { name: data.name.toUpperCase() },
        });
        if (existing) {
            throw new Error(`Tipo "${data.name}" já existe`);
        }
        const type = await prisma_1.prisma.productTypeConfig.create({
            data: {
                name: data.name.toUpperCase(),
                description: data.description,
                emoji: data.emoji,
            },
        });
        logger_1.logger.info('Tipo de produto criado', {
            typeId: type.id,
            name: type.name,
        });
        return type;
    }
    catch (error) {
        logger_1.logger.error('Erro ao criar tipo de produto', error);
        throw error;
    }
}
/**
 * Deleta um tipo de produto
 */
async function deleteProductType(name) {
    try {
        // Verifica se existem produtos com este tipo
        const productsWithType = await prisma_1.prisma.product.count({
            where: { type: name.toUpperCase() },
        });
        if (productsWithType > 0) {
            throw new Error(`Não é possível deletar tipo "${name}" - existem ${productsWithType} produtos com este tipo`);
        }
        const type = await prisma_1.prisma.productTypeConfig.delete({
            where: { name: name.toUpperCase() },
        });
        logger_1.logger.info('Tipo de produto deletado', {
            name: type.name,
        });
        return type;
    }
    catch (error) {
        logger_1.logger.error('Erro ao deletar tipo de produto', error);
        throw error;
    }
}
/**
 * Atualiza um tipo de produto
 */
async function updateProductType(name, data) {
    try {
        const targetName = name.toUpperCase();
        const newName = data.newName?.toUpperCase();
        // Se tiver newName e for diferente do atual, validar e usar transaction
        if (newName && newName !== targetName) {
            const existing = await prisma_1.prisma.productTypeConfig.findUnique({
                where: { name: newName },
            });
            if (existing) {
                throw new Error(`Tipo "${data.newName}" já existe`);
            }
            const [updatedType] = await prisma_1.prisma.$transaction([
                prisma_1.prisma.productTypeConfig.update({
                    where: { name: targetName },
                    data: {
                        name: newName,
                        description: data.description !== undefined ? data.description : undefined,
                        emoji: data.emoji !== undefined ? data.emoji : undefined,
                    },
                }),
                prisma_1.prisma.product.updateMany({
                    where: { type: targetName },
                    data: { type: newName },
                })
            ]);
            logger_1.logger.info('Tipo de produto renomeado', {
                oldName: targetName,
                newName: updatedType.name,
            });
            return updatedType;
        }
        const type = await prisma_1.prisma.productTypeConfig.update({
            where: { name: targetName },
            data: {
                description: data.description,
                emoji: data.emoji,
            },
        });
        logger_1.logger.info('Tipo de produto atualizado', {
            name: type.name,
        });
        return type;
    }
    catch (error) {
        logger_1.logger.error('Erro ao atualizar tipo de produto', error);
        throw error;
    }
}
//# sourceMappingURL=product-type.service.js.map