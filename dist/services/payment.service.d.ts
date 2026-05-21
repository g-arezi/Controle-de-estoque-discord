interface CreatePaymentInput {
    orderId: string;
    amount: number;
    description: string;
}
interface PaymentResponse {
    id: string;
    status: string;
    payment_url?: string;
    pix_key?: string;
    qr_code?: string;
}
export declare function createPayment(data: CreatePaymentInput): Promise<PaymentResponse>;
export declare function getPaymentStatus(paymentId: string): Promise<string>;
export declare function verifyWebhook(signature: string, payload: string): Promise<boolean>;
export {};
//# sourceMappingURL=payment.service.d.ts.map