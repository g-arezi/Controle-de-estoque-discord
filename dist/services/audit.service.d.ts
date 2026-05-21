export interface AuditLogInput {
    discordUserId: string;
    discordUsername: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
}
export declare function createAuditLog(data: AuditLogInput): Promise<{
    id: string;
    createdAt: Date;
    discordUserId: string;
    discordUsername: string;
    action: string;
    entity: string;
    entityId: string | null;
    details: string | null;
}>;
export declare function listAuditLogs(filters?: {
    userId?: string;
    action?: string;
    entity?: string;
    limit?: number;
}): Promise<{
    id: string;
    createdAt: Date;
    discordUserId: string;
    discordUsername: string;
    action: string;
    entity: string;
    entityId: string | null;
    details: string | null;
}[]>;
//# sourceMappingURL=audit.service.d.ts.map