export interface CreateProductTypeInput {
    name: string;
    description?: string;
    emoji?: string;
}
/**
 * Lista todos os tipos de produtos
 */
export declare function listProductTypes(): Promise<{
    id: string;
    name: string;
    emoji: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}[]>;
/**
 * Cria um novo tipo de produto
 */
export declare function createProductType(data: CreateProductTypeInput): Promise<{
    id: string;
    name: string;
    emoji: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Deleta um tipo de produto
 */
export declare function deleteProductType(name: string): Promise<{
    id: string;
    name: string;
    emoji: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
/**
 * Atualiza um tipo de produto
 */
export declare function updateProductType(name: string, data: Partial<CreateProductTypeInput> & {
    newName?: string;
}): Promise<{
    id: string;
    name: string;
    emoji: string | null;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
}>;
//# sourceMappingURL=product-type.service.d.ts.map