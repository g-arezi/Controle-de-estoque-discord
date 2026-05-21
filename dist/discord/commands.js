"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commands = void 0;
const discord_js_1 = require("discord.js");
const menuCommand = new discord_js_1.SlashCommandBuilder()
    .setName('menu')
    .setDescription('Mostra o menu de produtos disponíveis');
const menuCanallCommand = new discord_js_1.SlashCommandBuilder()
    .setName('menu-canal')
    .setDescription('Postar menu de produtos neste canal')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator);
const comprarCommand = new discord_js_1.SlashCommandBuilder()
    .setName('comprar')
    .setDescription('Inicia checkout de um produto')
    .addStringOption((option) => option.setName('id').setDescription('ID do produto').setRequired(true));
const estoqueCommand = new discord_js_1.SlashCommandBuilder()
    .setName('estoque')
    .setDescription('Gerenciar estoque (apenas administradores)')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) => subcommand
    .setName('listar')
    .setDescription('Listar todos os produtos')
    .addBooleanOption((option) => option
    .setName('todos')
    .setDescription('Incluir produtos inativos?')
    .setRequired(false)))
    .addSubcommand((subcommand) => subcommand
    .setName('adicionar')
    .setDescription('Adicionar novo produto')
    .addStringOption((option) => option.setName('nome').setDescription('Nome do produto').setRequired(true))
    .addNumberOption((option) => option.setName('preco').setDescription('Preço do produto').setRequired(true))
    .addIntegerOption((option) => option.setName('quantidade').setDescription('Quantidade em estoque').setRequired(true))
    .addStringOption((option) => option.setName('categoria').setDescription('Categoria do produto').setRequired(true))
    .addStringOption((option) => option
    .setName('tipo')
    .setDescription('Tipo de produto')
    .setRequired(false)
    .addChoices({ name: 'ITEMS', value: 'ITEMS' }, { name: 'SKINS', value: 'SKINS' }, { name: 'CONTAS', value: 'CONTAS' }, { name: 'PASSE', value: 'PASSE' }, { name: 'MODS', value: 'MODS' }, { name: 'AUXILIARES', value: 'AUXILIARES' }, { name: 'REGEDIT', value: 'REGEDIT' }, { name: 'DIGITAL', value: 'DIGITAL' }, { name: 'PHYSICAL', value: 'PHYSICAL' }))
    .addChannelOption((option) => option
    .setName('canal')
    .setDescription('Canal para postar o menu')
    .setRequired(false))
    .addStringOption((option) => option.setName('descricao').setDescription('Descrição do produto').setRequired(false))
    .addStringOption((option) => option.setName('imagem').setDescription('URL da imagem').setRequired(false))
    .addStringOption((option) => option.setName('video').setDescription('URL do vídeo').setRequired(false)))
    .addSubcommand((subcommand) => subcommand
    .setName('editar')
    .setDescription('Editar produto existente')
    .addStringOption((option) => option.setName('id').setDescription('ID do produto').setRequired(true))
    .addStringOption((option) => option.setName('nome').setDescription('Novo nome').setRequired(false))
    .addNumberOption((option) => option.setName('preco').setDescription('Novo preço').setRequired(false))
    .addStringOption((option) => option.setName('categoria').setDescription('Nova categoria').setRequired(false))
    .addStringOption((option) => option
    .setName('tipo')
    .setDescription('Novo tipo de produto')
    .setRequired(false)
    .addChoices({ name: 'ITEMS', value: 'ITEMS' }, { name: 'SKINS', value: 'SKINS' }, { name: 'CONTAS', value: 'CONTAS' }, { name: 'PASSE', value: 'PASSE' }, { name: 'MODS', value: 'MODS' }, { name: 'AUXILIARES', value: 'AUXILIARES' }, { name: 'REGEDIT', value: 'REGEDIT' }, { name: 'DIGITAL', value: 'DIGITAL' }, { name: 'PHYSICAL', value: 'PHYSICAL' }))
    .addChannelOption((option) => option
    .setName('canal')
    .setDescription('Novo canal para o produto')
    .setRequired(false))
    .addStringOption((option) => option
    .setName('status')
    .setDescription('ACTIVE ou INACTIVE')
    .setRequired(false)
    .addChoices({ name: 'ACTIVE', value: 'ACTIVE' }, { name: 'INACTIVE', value: 'INACTIVE' }))
    .addStringOption((option) => option.setName('descricao').setDescription('Nova descrição').setRequired(false))
    .addStringOption((option) => option.setName('imagem').setDescription('Nova URL da imagem').setRequired(false))
    .addStringOption((option) => option.setName('video').setDescription('Nova URL do vídeo').setRequired(false)))
    .addSubcommand((subcommand) => subcommand
    .setName('remover')
    .setDescription('Remover produto')
    .addStringOption((option) => option.setName('id').setDescription('ID do produto a remover').setRequired(true)))
    .addSubcommand((subcommand) => subcommand
    .setName('quantidade')
    .setDescription('Ajustar estoque')
    .addStringOption((option) => option.setName('id').setDescription('ID do produto').setRequired(true))
    .addIntegerOption((option) => option.setName('quantidade').setDescription('Nova quantidade').setRequired(true)));
const tiposCommand = new discord_js_1.SlashCommandBuilder()
    .setName('tipos')
    .setDescription('Gerenciar tipos de produtos (apenas administradores)')
    .setDefaultMemberPermissions(discord_js_1.PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) => subcommand
    .setName('listar')
    .setDescription('Listar todos os tipos de produtos'))
    .addSubcommand((subcommand) => subcommand
    .setName('criar')
    .setDescription('Criar novo tipo de produto')
    .addStringOption((option) => option
    .setName('nome')
    .setDescription('Nome do tipo (ex: ITEMS, SKINS, PASSE, MODS)')
    .setRequired(true))
    .addStringOption((option) => option.setName('descricao').setDescription('Descrição do tipo').setRequired(false))
    .addStringOption((option) => option.setName('emoji').setDescription('Emoji do tipo (ex: 🎮)').setRequired(false)))
    .addSubcommand((subcommand) => subcommand
    .setName('deletar')
    .setDescription('Deletar tipo de produto')
    .addStringOption((option) => option.setName('nome').setDescription('Nome do tipo a deletar').setRequired(true)))
    .addSubcommand((subcommand) => subcommand
    .setName('editar')
    .setDescription('Editar tipo de produto')
    .addStringOption((option) => option.setName('nome').setDescription('Nome do tipo a editar').setRequired(true))
    .addStringOption((option) => option.setName('novo_nome').setDescription('Novo nome para o tipo').setRequired(false))
    .addStringOption((option) => option.setName('descricao').setDescription('Nova descrição').setRequired(false))
    .addStringOption((option) => option.setName('emoji').setDescription('Novo emoji').setRequired(false)));
exports.commands = [menuCommand, menuCanallCommand, comprarCommand, estoqueCommand, tiposCommand];
//# sourceMappingURL=commands.js.map