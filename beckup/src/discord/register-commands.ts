import { REST, Routes } from 'discord.js';
import { config } from '../config/env';
import { logger } from '../lib/logger';
import { commands } from './commands';

export async function registerCommands(): Promise<void> {
  try {
    const rest = new REST({ version: '10' }).setToken(config.discord.token);

    const commandData = commands.map((cmd) => cmd.toJSON());

    logger.info('Iniciando registro de comandos...');

    if (config.discord.guildId) {
      // Registra apenas no servidor específico (mais rápido para testes)
      await rest.put(
        Routes.applicationGuildCommands(
          config.discord.clientId,
          config.discord.guildId
        ),
        { body: commandData }
      );
      logger.info(`Comandos registrados no servidor: ${config.discord.guildId}`);
    } else {
      // Registra globalmente (leva até 1 hora para sincronizar)
      await rest.put(Routes.applicationCommands(config.discord.clientId), {
        body: commandData,
      });
      logger.info('Comandos registrados globalmente');
    }

    logger.info('Registro de comandos concluído!');
  } catch (error) {
    logger.error('Erro ao registrar comandos', error);
    throw error;
  }
}
