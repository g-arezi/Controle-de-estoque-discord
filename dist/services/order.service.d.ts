import { Prisma } from '@prisma/client';
type OrderStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
export interface CreateOrderInput {
    discordUserId: string;
    discordUsername: string;
    productId: string;
    quantity?: number;
}
export declare function createOrder(data: CreateOrderInput): Promise<any>;
export declare function getOrder(orderId: string): Promise<({
    product: {
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
    };
} & {
    id: string;
    status: import(".prisma/client").$Enums.OrderStatus;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    discordUserId: string;
    discordUsername: string;
    productId: string;
    totalPrice: Prisma.Decimal;
    paymentId: string | null;
    paymentUrl: string | null;
    pixKey: string | null;
    expiresAt: Date | null;
    completedAt: Date | null;
}) | null>;
export declare function updateOrderStatus(orderId: string, status: OrderStatus, additionalData?: {
    paymentId?: string;
    paymentUrl?: string;
    pixKey?: string;
}): Promise<{
    product: {
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
    };
} & {
    id: string;
    status: import(".prisma/client").$Enums.OrderStatus;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    discordUserId: string;
    discordUsername: string;
    productId: string;
    totalPrice: Prisma.Decimal;
    paymentId: string | null;
    paymentUrl: string | null;
    pixKey: string | null;
    expiresAt: Date | null;
    completedAt: Date | null;
}>;
export declare function listUserOrders(discordUserId: string): Promise<({
    product: {
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
    };
} & {
    id: string;
    status: import(".prisma/client").$Enums.OrderStatus;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    discordUserId: string;
    discordUsername: string;
    productId: string;
    totalPrice: Prisma.Decimal;
    paymentId: string | null;
    paymentUrl: string | null;
    pixKey: string | null;
    expiresAt: Date | null;
    completedAt: Date | null;
})[]>;
export declare function cancelExpiredOrders(): Promise<{
    id: string;
    status: import(".prisma/client").$Enums.OrderStatus;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
    discordUserId: string;
    discordUsername: string;
    productId: string;
    totalPrice: Prisma.Decimal;
    paymentId: string | null;
    paymentUrl: string | null;
    pixKey: string | null;
    expiresAt: Date | null;
    completedAt: Date | null;
}[]>;
export {};
//# sourceMappingURL=order.service.d.ts.map