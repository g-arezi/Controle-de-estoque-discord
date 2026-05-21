"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const requiredEnvVars = [
    'DISCORD_TOKEN',
    'DISCORD_CLIENT_ID',
    'DATABASE_URL',
];
function validateEnv() {
    const missing = [];
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
exports.config = {
    discord: {
        token: process.env.DISCORD_TOKEN,
        clientId: process.env.DISCORD_CLIENT_ID,
        estoqueChannelId: process.env.ESTOQUE_CHANNEL_ID,
        guildId: process.env.DISCORD_GUILD_ID,
    },
    database: {
        url: process.env.DATABASE_URL,
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
//# sourceMappingURL=env.js.map