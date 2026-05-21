import { Prisma } from '@prisma/client';
type ProductType = 'DIGITAL' | 'PHYSICAL' | 'ITEMS' | 'SKINS' | 'CONTAS' | 'PASSE' | 'MODS' | 'AUXILIARES' | 'REGEDIT';
type ProductStatus = 'ACTIVE' | 'INACTIVE';
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
export declare function createProduct(data: CreateProductInput): Promise<{
    id: string;
    name: string;
    status: import(".prisma/client").$Enums.ProductStatus;
    description: string | null;
    type: string;
    price: Prisma.Decimal;
    quantity: number;
    category: string;
    channelId: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function updateProduct(productId: string, data: UpdateProductInput): Promise<{
    id: string;
    name: string;
    status: import(".prisma/client").$Enums.ProductStatus;
    description: string | null;
    type: string;
    price: Prisma.Decimal;
    quantity: number;
    category: string;
    channelId: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Lista produtos de um canal específico
 */
export declare function listProductsByChannel(channelId: string, includeInactive?: boolean): Promise<{
    id: string;
    name: string;
    status: import(".prisma/client").$Enums.ProductStatus;
    description: string | null;
    type: string;
    price: Prisma.Decimal;
    quantity: number;
    category: string;
    channelId: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare function getProduct(productId: string): Promise<{
    id: string;
    name: string;
    status: import(".prisma/client").$Enums.ProductStatus;
    description: string | null;
    type: string;
    price: Prisma.Decimal;
    quantity: number;
    category: string;
    channelId: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare function listProducts(includeInactive?: boolean): Promise<{
    id: string;
    name: string;
    status: import(".prisma/client").$Enums.ProductStatus;
    description: string | null;
    type: string;
    price: Prisma.Decimal;
    quantity: number;
    category: string;
    channelId: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}[]>;
export declare function deleteProduct(productId: string): Promise<void>;
export declare function updateProductQuantity(productId: string, newQuantity: number): Promise<{
    id: string;
    name: string;
    status: import(".prisma/client").$Enums.ProductStatus;
    description: string | null;
    type: string;
    price: Prisma.Decimal;
    quantity: number;
    category: string;
    channelId: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export declare function decreaseProductQuantity(productId: string, amount: number): Promise<{
    id: string;
    name: string;
    status: import(".prisma/client").$Enums.ProductStatus;
    description: string | null;
    type: string;
    price: Prisma.Decimal;
    quantity: number;
    category: string;
    channelId: string | null;
    imageUrl: string | null;
    videoUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
export {};
//# sourceMappingURL=product.service.d.ts.map