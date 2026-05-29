"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const env_1 = require("./config/env");
const logger_1 = require("./lib/logger");
const prisma_1 = require("./config/prisma");
const register_commands_1 = require("./discord/register-commands");
const interaction_handler_1 = require("./discord/interaction-handler");
const server_1 = require("./web/server");
const orderService = __importStar(require("./services/order.service"));
// Inicializar cliente Discord
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
});
// Servidor Express
const app = (0, server_1.createExpressApp)();
// Event: Bot conectado
client.once(discord_js_1.Events.ClientReady, async () => {
    logger_1.logger.info(`✅ Bot conectado como ${client.user?.tag}`);
    logger_1.logger.info(`Connectado nos servidores: ${client.guilds.cache.map((g) => g.name).join(', ')}`);
    // Registrar comandos
    try {
        await (0, register_commands_1.registerCommands)();
    }
    catch (error) {
        logger_1.logger.error('Erro ao registrar comandos', error);
    }
    // Definir status
    client.user?.setActivity('/menu - Gerenciador de Estoque', {
        type: 'Watching',
    });
    // Iniciar tarefas agendadas
    startScheduledTasks();
});
// Event: Interações (slash commands, buttons, etc)
client.on('interactionCreate', async (interaction) => {
    await (0, interaction_handler_1.handleInteraction)(interaction);
});
// Event: Erro
client.on('error', (error) => {
    logger_1.logger.error('Erro do cliente Discord', error);
});
// Event: Warning
client.on('warn', (warning) => {
    logger_1.logger.warn('Aviso do cliente Discord', warning);
});
// Tarefas agendadas
function startScheduledTasks() {
    // Limpar pedidos expirados a cada 5 minutos
    setInterval(async () => {
        try {
            await orderService.cancelExpiredOrders();
        }
        catch (error) {
            logger_1.logger.error('Erro ao limpar pedidos expirados', error);
        }
    }, 5 * 60 * 1000);
    logger_1.logger.info('Tarefas agendadas iniciadas');
}
// Inicializar aplicação
async function main() {
    try {
        logger_1.logger.info('Iniciando bot de estoque Discord...');
        // Testar conexão com banco
        await prisma_1.prisma.$queryRaw `SELECT 1`;
        logger_1.logger.info('✅ Conexão com banco de dados estabelecida');
        // Iniciar servidor Express
        (0, server_1.startExpressServer)(app);
        // Conectar ao Discord
        await client.login(env_1.config.discord.token);
        logger_1.logger.info('🚀 Bot iniciado com sucesso!');
    }
    catch (error) {
        logger_1.logger.error('Erro ao iniciar bot', error);
        process.exit(1);
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    logger_1.logger.info('Encerrando bot...');
    await client.destroy();
    await prisma_1.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    logger_1.logger.info('Encerrando bot (SIGTERM)...');
    await client.destroy();
    await prisma_1.prisma.$disconnect();
    process.exit(0);
});
// Iniciar
main().catch((error) => {
    logger_1.logger.error('Erro fatal', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map