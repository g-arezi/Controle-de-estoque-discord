"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuditLog = createAuditLog;
exports.listAuditLogs = listAuditLogs;
const prisma_1 = require("../config/prisma");
const logger_1 = require("../lib/logger");
async function createAuditLog(data) {
    try {
        const log = await prisma_1.prisma.auditLog.create({
            data: {
                discordUserId: data.discordUserId,
                discordUsername: data.discordUsername,
                action: data.action,
                entity: data.entity,
                entityId: data.entityId,
                details: data.details ? JSON.stringify(data.details) : undefined,
            },
        });
        logger_1.logger.info('Auditoria registrada', {
            action: data.action,
            entity: data.entity,
            userId: data.discordUserId,
        });
        return log;
    }
    catch (error) {
        logger_1.logger.error('Erro ao registrar auditoria', error);
        throw error;
    }
}
async function listAuditLogs(filters) {
    try {
        const logs = await prisma_1.prisma.auditLog.findMany({
            where: {
                ...(filters?.userId && { discordUserId: filters.userId }),
                ...(filters?.action && { action: filters.action }),
                ...(filters?.entity && { entity: filters.entity }),
            },
            orderBy: { createdAt: 'desc' },
            take: filters?.limit || 50,
        });
        return logs;
    }
    catch (error) {
        logger_1.logger.error('Erro ao listar auditoria', error);
        throw error;
    }
}
//# sourceMappingURL=audit.service.js.map