import { Client, GatewayIntentBits } from 'discord.js';
import { config } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './config/prisma';
import { registerCommands } from './discord/register-commands';
import { handleInteraction } from './discord/interaction-handler';
import { createExpressApp, startExpressServer } from './web/server';
import * as orderService from './services/order.service';

// Inicializar cliente Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Servidor Express
const app = createExpressApp();

// Event: Bot conectado
client.on('ready', async () => {
  logger.info(`✅ Bot conectado como ${client.user?.tag}`);

  // Registrar comandos
  try {
    await registerCommands();
  } catch (error) {
    logger.error('Erro ao registrar comandos', error);
  }

  // Definir status
  client.user?.setActivity('/menu - Gerenciador de Estoque', {
    type: 'Watching' as any,
  });

  // Iniciar tarefas agendadas
  startScheduledTasks();
});

// Event: Interações (slash commands, buttons, etc)
client.on('interactionCreate', async (interaction) => {
  await handleInteraction(interaction);
});

// Event: Erro
client.on('error', (error) => {
  logger.error('Erro do cliente Discord', error);
});

// Event: Warning
client.on('warn', (warning) => {
  logger.warn('Aviso do cliente Discord', warning);
});

// Tarefas agendadas
function startScheduledTasks(): void {
  // Limpar pedidos expirados a cada 5 minutos
  setInterval(async () => {
    try {
      await orderService.cancelExpiredOrders();
    } catch (error) {
      logger.error('Erro ao limpar pedidos expirados', error);
    }
  }, 5 * 60 * 1000);

  logger.info('Tarefas agendadas iniciadas');
}

// Inicializar aplicação
async function main(): Promise<void> {
  try {
    logger.info('Iniciando bot de estoque Discord...');

    // Testar conexão com banco
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Conexão com banco de dados estabelecida');

    // Iniciar servidor Express
    startExpressServer(app);

    // Conectar ao Discord
    await client.login(config.discord.token);

    logger.info('🚀 Bot iniciado com sucesso!');
  } catch (error) {
    logger.error('Erro ao iniciar bot', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Encerrando bot...');
  await client.destroy();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Encerrando bot (SIGTERM)...');
  await client.destroy();
  await prisma.$disconnect();
  process.exit(0);
});

// Iniciar
main().catch((error) => {
  logger.error('Erro fatal', error);
  process.exit(1);
});
