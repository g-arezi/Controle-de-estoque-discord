import { prisma } from '../config/prisma';

const RATE_LIMIT_WINDOW = 30; // segundos
const RATE_LIMIT_MAX_ATTEMPTS = 1;

export async function checkRateLimit(
  userId: string,
  action: string
): Promise<{ allowed: boolean; remainingTime: number }> {
  const now = new Date();

  // Busca ou cria registro de rate limit
  let record = await prisma.rateLimit.findFirst({
    where: {
      discordUserId: userId,
      action,
      resetAt: {
        gt: now,
      },
    },
  });

  if (!record) {
    // Nenhum registro dentro da janela - cria novo
    const resetAt = new Date(now.getTime() + RATE_LIMIT_WINDOW * 1000);
    record = await prisma.rateLimit.create({
      data: {
        discordUserId: userId,
        action,
        count: 1,
        resetAt,
      },
    });
    return { allowed: true, remainingTime: 0 };
  }

  // Registr encontrado - verifica limite
  if (record.count >= RATE_LIMIT_MAX_ATTEMPTS) {
    const remainingTime = Math.ceil(
      (record.resetAt.getTime() - now.getTime()) / 1000
    );
    return { allowed: false, remainingTime };
  }

  // Incrementa contador
  await prisma.rateLimit.update({
    where: { id: record.id },
    data: { count: record.count + 1 },
  });

  const remainingTime = Math.ceil(
    (record.resetAt.getTime() - now.getTime()) / 1000
  );

  return { allowed: true, remainingTime };
}
