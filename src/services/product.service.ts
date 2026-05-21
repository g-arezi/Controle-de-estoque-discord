import { prisma } from '../config/prisma';
import { Prisma } from '@prisma/client';

type ProductType =
  | 'DIGITAL'
  | 'PHYSICAL'
  | 'ITEMS'
  | 'SKINS'
  | 'CONTAS'
  | 'PASSE'
  | 'MODS'
  | 'AUXILIARES'
  | 'REGEDIT';
type ProductStatus = 'ACTIVE' | 'INACTIVE';
import { logger } from '../lib/logger';

export interface CreateProductInput {
  name: string;
  price: number;
  quantity: number;
  category: string;
  type?: ProductType;
  channelId?: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface UpdateProductInput {
  name?: string;
  price?: number;
  category?: string;
  type?: ProductType;
  channelId?: string | null;
  status?: ProductStatus;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export async function createProduct(data: CreateProductInput) {
  try {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        price: data.price,
        quantity: data.quantity,
        category: data.category,
        type: (data.type || 'DIGITAL') as any,
        channelId: data.channelId || null,
        description: data.description,
        imageUrl: data.imageUrl,
        videoUrl: data.videoUrl,
        status: 'ACTIVE' as any,
      },
    });

    logger.info('Produto criado', {
      productId: product.id,
      name: product.name,
      channelId: product.channelId,
    });

    return product;
  } catch (error) {
    logger.error('Erro ao criar produto', error);
    throw error;
  }
}

export async function updateProduct(productId: string, data: UpdateProductInput) {
  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data,
    });

    logger.info('Produto atualizado', {
      productId,
      changes: data,
    });

    return product;
  } catch (error) {
    logger.error('Erro ao atualizar produto', error);
    throw error;
  }
}

/**
 * Lista produtos de um canal específico
 */
export async function listProductsByChannel(channelId: string, includeInactive = false) {
  try {
    const where: any = {
      channelId,
    };

    if (!includeInactive) {
      where.status = 'ACTIVE';
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return products;
  } catch (error) {
    logger.error('Erro ao listar produtos por canal', error);
    throw error;
  }
}

export async function getProduct(productId: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    return product;
  } catch (error) {
    logger.error('Erro ao buscar produto', error);
    throw error;
  }
}

export async function listProducts(includeInactive = false) {
  try {
    const products = await prisma.product.findMany({
      where: includeInactive
        ? {}
        : { status: 'ACTIVE' as any },
      orderBy: { createdAt: 'desc' },
    });

    return products;
  } catch (error) {
    logger.error('Erro ao listar produtos', error);
    throw error;
  }
}

export async function deleteProduct(productId: string) {
  try {
    await prisma.product.delete({
      where: { id: productId },
    });

    logger.info('Produto deletado', { productId });
  } catch (error) {
    logger.error('Erro ao deletar produto', error);
    throw error;
  }
}

export async function updateProductQuantity(productId: string, newQuantity: number) {
  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: { quantity: newQuantity },
    });

    logger.info('Estoque atualizado', {
      productId,
      newQuantity,
    });

    return product;
  } catch (error) {
    logger.error('Erro ao atualizar estoque', error);
    throw error;
  }
}

export async function decreaseProductQuantity(productId: string, amount: number) {
  try {
    const product = await prisma.product.update({
      where: { id: productId },
      data: { quantity: { decrement: amount } },
    });

    return product;
  } catch (error) {
    logger.error('Erro ao diminuir estoque', error);
    throw error;
  }
}
