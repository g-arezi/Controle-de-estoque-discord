"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCommands = registerCommands;
const discord_js_1 = require("discord.js");
const env_1 = require("../config/env");
const logger_1 = require("../lib/logger");
const commands_1 = require("./commands");
async function registerCommands() {
    try {
        const rest = new discord_js_1.REST({ version: '10' }).setToken(env_1.config.discord.token);
        const commandData = commands_1.commands.map((cmd) => cmd.toJSON());
        logger_1.logger.info('Iniciando registro de comandos...');
        if (env_1.config.discord.guildId) {
            // Registra apenas no servidor específico (mais rápido para testes)
            await rest.put(discord_js_1.Routes.applicationGuildCommands(env_1.config.discord.clientId, env_1.config.discord.guildId), { body: commandData });
            logger_1.logger.info(`Comandos registrados no servidor: ${env_1.config.discord.guildId}`);
        }
        else {
            // Registra globalmente (leva até 1 hora para sincronizar)
            await rest.put(discord_js_1.Routes.applicationCommands(env_1.config.discord.clientId), {
                body: commandData,
            });
            logger_1.logger.info('Comandos registrados globalmente');
        }
        logger_1.logger.info('Registro de comandos concluído!');
    }
    catch (error) {
        logger_1.logger.error('Erro ao registrar comandos', error);
        throw error;
    }
}
//# sourceMappingURL=register-commands.js.map