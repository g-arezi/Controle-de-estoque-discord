import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'DISCORD_TOKEN',
  'DISCORD_CLIENT_ID',
  'DISCORD_GUILD_ID',
  'DATABASE_URL',
];

function validateEnv() {
  const missing: string[] = [];

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Variáveis de ambiente obrigatórias faltando: ${missing.join(', ')}`);
  }
}

validateEnv();

export const config = {
  discord: {
    token: process.env.DISCORD_TOKEN!,
    clientId: process.env.DISCORD_CLIENT_ID!,
    estoqueChannelId: process.env.ESTOQUE_CHANNEL_ID!,
    guildId: process.env.DISCORD_GUILD_ID!,
  },
  database: {
    url: process.env.DATABASE_URL!,
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
  },
  payment: {
    infinitePayUrl: process.env.INFINITEPAY_API_URL,
    infinitePayKey: process.env.INFINITEPAY_API_KEY,
    infinitePaySecret: process.env.INFINITEPAY_SECRET,
    webhookSecret: process.env.WEBHOOK_SECRET,
    pixKey: process.env.PIX_KEY,
  },
  nodeEnv: process.env.NODE_ENV || 'development',
};
