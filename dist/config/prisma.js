"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("../lib/logger");
const prisma = new client_1.PrismaClient({
    log: [
        { level: 'error', emit: 'event' },
        { level: 'warn', emit: 'event' },
    ],
});
exports.prisma = prisma;
prisma.$on('error', (e) => {
    logger_1.logger.error('Erro Prisma:', e);
});
prisma.$on('warn', (e) => {
    logger_1.logger.warn('Aviso Prisma:', e);
});
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
//# sourceMappingURL=prisma.js.map