import { prisma } from '../config/prisma';
import { logger } from '../lib/logger';

export interface AuditLogInput {
  discordUserId: string;
  discordUsername: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: any;
}

export async function createAuditLog(data: AuditLogInput) {
  try {
    const log = await prisma.auditLog.create({
      data: {
        discordUserId: data.discordUserId,
        discordUsername: data.discordUsername,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details ? JSON.stringify(data.details) : undefined,
      },
    });

    logger.info('Auditoria registrada', {
      action: data.action,
      entity: data.entity,
      userId: data.discordUserId,
    });

    return log;
  } catch (error) {
    logger.error('Erro ao registrar auditoria', error);
    throw error;
  }
}

export async function listAuditLogs(
  filters?: {
    userId?: string;
    action?: string;
    entity?: string;
    limit?: number;
  }
) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: {
        ...(filters?.userId && { discordUserId: filters.userId }),
        ...(filters?.action && { action: filters.action }),
        ...(filters?.entity && { entity: filters.entity }),
      },
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 50,
    });

    return logs;
  } catch (error) {
    logger.error('Erro ao listar auditoria', error);
    throw error;
  }
}
