import { prisma } from '../config/prisma';
import { logger } from '../lib/logger';

export interface CreateProductTypeInput {
  name: string;
  description?: string;
  emoji?: string;
}

/**
 * Lista todos os tipos de produtos
 */
export async function listProductTypes() {
  try {
    const types = await prisma.productTypeConfig.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return types;
  } catch (error) {
    logger.error('Erro ao listar tipos de produtos', error);
    throw error;
  }
}

/**
 * Cria um novo tipo de produto
 */
export async function createProductType(data: CreateProductTypeInput) {
  try {
    // Verifica se tipo já existe
    const existing = await prisma.productTypeConfig.findUnique({
      where: { name: data.name.toUpperCase() },
    });

    if (existing) {
      throw new Error(`Tipo "${data.name}" já existe`);
    }

    const type = await prisma.productTypeConfig.create({
      data: {
        name: data.name.toUpperCase(),
        description: data.description,
        emoji: data.emoji,
      },
    });

    logger.info('Tipo de produto criado', {
      typeId: type.id,
      name: type.name,
    });

    return type;
  } catch (error) {
    logger.error('Erro ao criar tipo de produto', error);
    throw error;
  }
}

/**
 * Deleta um tipo de produto
 */
export async function deleteProductType(name: string) {
  try {
    // Verifica se existem produtos com este tipo
    const productsWithType = await prisma.product.count({
      where: { type: name.toUpperCase() },
    });

    if (productsWithType > 0) {
      throw new Error(
        `Não é possível deletar tipo "${name}" - existem ${productsWithType} produtos com este tipo`
      );
    }

    const type = await prisma.productTypeConfig.delete({
      where: { name: name.toUpperCase() },
    });

    logger.info('Tipo de produto deletado', {
      name: type.name,
    });

    return type;
  } catch (error) {
    logger.error('Erro ao deletar tipo de produto', error);
    throw error;
  }
}

/**
 * Atualiza um tipo de produto
 */
export async function updateProductType(
  name: string,
  data: Partial<CreateProductTypeInput> & { newName?: string }
) {
  try {
    const targetName = name.toUpperCase();
    const newName = data.newName?.toUpperCase();

    // Se tiver newName e for diferente do atual, validar e usar transaction
    if (newName && newName !== targetName) {
      const existing = await prisma.productTypeConfig.findUnique({
        where: { name: newName },
      });

      if (existing) {
        throw new Error(`Tipo "${data.newName}" já existe`);
      }

      const [updatedType] = await prisma.$transaction([
        prisma.productTypeConfig.update({
          where: { name: targetName },
          data: {
            name: newName,
            description: data.description !== undefined ? data.description : undefined,
            emoji: data.emoji !== undefined ? data.emoji : undefined,
          },
        }),
        prisma.product.updateMany({
          where: { type: targetName },
          data: { type: newName },
        })
      ]);

      logger.info('Tipo de produto renomeado', {
        oldName: targetName,
        newName: updatedType.name,
      });

      return updatedType;
    }

    const type = await prisma.productTypeConfig.update({
      where: { name: targetName },
      data: {
        description: data.description,
        emoji: data.emoji,
      },
    });

    logger.info('Tipo de produto atualizado', {
      name: type.name,
    });

    return type;
  } catch (error) {
    logger.error('Erro ao atualizar tipo de produto', error);
    throw error;
  }
}
