type TicketStage = 'pending' | 'completed';
/**
 * Cria ou reaproveita um canal/thread privado do pedido.
 * No início do checkout, abre a sala para o cliente e para a administração.
 * Quando o pagamento é aprovado, reaproveita a mesma sala para a entrega.
 */
export declare function ensureDeliveryTicket(orderId: string, stage?: TicketStage): Promise<{
    id: string;
    name: string;
} | null>;
export {};
//# sourceMappingURL=ticket.service.d.ts.map