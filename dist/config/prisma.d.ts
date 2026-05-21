import { PrismaClient } from '@prisma/client';
declare const prisma: PrismaClient<{
    log: ({
        level: "error";
        emit: "event";
    } | {
        level: "warn";
        emit: "event";
    })[];
}, "warn" | "error", import("@prisma/client/runtime/library").DefaultArgs>;
export { prisma };
//# sourceMappingURL=prisma.d.ts.map