# 🛒 Bot de Discord — Controle de Estoque

Bot profissional para gerenciamento e venda de produtos digitais e físicos via Discord.

## Sumário

- [Sobre](#sobre)
- [Requisitos](#requisitos)
- [Quick Start (Docker)](#quick-start-docker)
- [Instalação Manual](#instalação-manual)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Comandos do Bot](#comandos-do-bot)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Troubleshooting](#troubleshooting)

## Sobre

Principais tecnologias: Node.js 18+, TypeScript, discord.js v14, Prisma v5, PostgreSQL.

Funcionalidades principais:
- CRUD de produtos
- Menu interativo para compra
- Checkout integrado (suporta InfinitePay)
- Rate limiting (1 checkout / 30s por usuário)
- Reservas temporárias e tickets privados para entrega
- Logging estruturado e transações seguras (SERIALIZABLE)

## Requisitos

- Docker & Docker Compose (recomendado)
- Node.js 18+ (para execução local)
- PostgreSQL 16+

## Quick Start (Docker)

1. Copie e ajuste o arquivo de variáveis de ambiente:

```bash
cp .env.example .env
# edite .env conforme necessário
```

2. Build e suba os containers:

```bash
docker compose up -d --build
```

3. Aplicar migrations (opcional se o container já executar isso):

```bash
docker compose exec app npx prisma migrate deploy
```

4. Ver logs:

```bash
docker compose logs app -f
```

## Instalação manual

1. Instale dependências:

```bash
npm install
```

2. Configure o banco (exemplo local PostgreSQL):

```bash
createdb -U postgres discord_stock
```

3. Rode migrations:

```bash
npx prisma migrate deploy
```

4. Compile e inicie:

```bash
npm run build
node dist/src/main.js
```

## Variáveis de ambiente

Crie `.env` na raiz (ou use `.env.example`). Exemplo mínimo:

```env
# Discord
DISCORD_TOKEN=seu_token_aqui
DISCORD_CLIENT_ID=seu_client_id
ESTOQUE_CHANNEL_ID=seu_channel_id

# PostgreSQL
DATABASE_URL=postgresql://discord:senha@localhost:5432/discord_stock?schema=public

# Servidor
PORT=3000

# InfinitePay (opcional)
INFINITEPAY_API_URL=https://api.infinitepay.io
INFINITEPAY_API_KEY=sua_chave_api
INFINITEPAY_SECRET=seu_secret
WEBHOOK_SECRET=seu_webhook_secret_minimo_32_chars
```

## Comandos do bot (resumo)

- `/menu` — Mostra lista de produtos e opções de compra.
- `/menu-canal` — Mostra produtos filtrados pelo canal (admin recommended).
- `/comprar id:<produto_id>` — Inicia checkout para o produto.
- `/estoque` — Grupo de subcomandos admin: `listar`, `adicionar`, `editar`, `remover`, `quantidade`.

Exemplos:

```bash
# Comprar por ID (exemplo de uso dentro do Discord)
/comprar id:prod_1234567890123

# Ajustar estoque (admin)
/estoque quantidade id:prod_1234567890123 quantidade:15
```

## Estrutura do projeto

```
.
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
├── tsconfig.json
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── main.ts
+│   ├── config/
│   ├── discord/
│   ├── lib/
│   ├── services/
│   └── web/
└── dist/
```

## Troubleshooting

- Bot não responde aos comandos:

```bash
docker compose restart app
```

- Erro P1001 (Prisma não alcança DB):

```bash
docker compose down && docker compose up -d
docker compose ps
```

- Verificar variáveis de ambiente:

```bash
ls -la .env
cat .env
```

## Comandos úteis

```bash
# Logs
docker compose logs app --tail 200

# Acessar DB
docker compose exec postgres psql -U discord -d discord_stock
```

---

Se quiser, posso:
- ajustar mais detalhes do `README.md` (badges, links, exemplos de payloads), ou
- criar um `.env.example` e um arquivo de instruções para deploy.


## ⚙️ Configuração

### Arquivo `.env`

Veja o arquivo `.env.example` para referência completa.

### Como obter o Discord Token

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Clique em "New Application"
3. Vá em "Bot" → "Add Bot"
4. Copie o token em "TOKEN"
5. Ative as permissões necessárias:
   - Slash Commands
   - Send Messages
   - Embed Links
   - Attach Files

### Convidar o bot

Use o link abaixo substituindo `YOUR_CLIENT_ID` pelo `DISCORD_CLIENT_ID` da sua aplicação (ou copie o valor em `.env`).

Link de convite (permissões recomendadas — Send Messages, Embed Links, Attach Files):

https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=51200&scope=bot%20applications.commands

Você também pode gerar o link em "OAuth2 → URL Generator" no Discord Developer Portal.

### Como obter Channel/Guild ID

1. Ative Developer Mode no Discord (User Settings → Advanced)
2. Clique direito no canal/servidor
3. Copie o ID

## 🔍 Troubleshooting

### Bot não responde aos comandos

**Problema:** `/menu` ou `/estoque` não aparecem como opções

**Solução:**
```bash
# Reinicie o bot
docker compose restart app

# Ou manualmente
docker compose down
docker compose up -d --build
```

Se ainda não funcionar:
- Feche e abra o Discord completamente (não apenas minimize)
- Ou aguarde 1 hora para atualização global de comandos

---

### Erro: "Apenas administradores podem..."

**Problema:** Recebe mensagem de permissão negada

**Solução:**
- Verifique se sua conta tem permissão de Administrator no servidor
- Ou peça para um admin usar o comando

---

### Erro de conexão com banco de dados

**Problema:** `Error: P1001: Can't reach database server`

**Solução:**
```bash
# Reinicie os containers
docker compose down
docker compose up -d

# Verifique se o PostgreSQL está rodando
docker compose ps
```

---

### Rate limiting - Não consigo comprar rápido

**Problema:** "Aguarde 30 segundos antes de outro checkout"

**Solução:**
O sistema está protegido contra abuso. Aguarde 30 segundos entre compras do mesmo usuário.

---

### Variáveis de ambiente não carregadas

**Problema:** Bot começa mas não conecta ao banco

**Solução:**
```bash
# Verifique o arquivo .env existe
ls -la .env

# Verifique as variáveis
cat .env

# Reinicie
docker compose restart app
```

### Testar entrega sem API de pagamento

Se você ainda não tem a chave da API, pode simular a aprovação do pagamento em ambiente local e abrir o ticket de entrega assim:

```bash
curl -X POST http://localhost:3000/webhooks/payment/test \
  -H 'Content-Type: application/json' \
  -d '{"order_id":"ord_seu_pedido"}'
```

Isso marca o pedido como `COMPLETED` e cria o canal privado de entrega para o comprador. O endpoint fica liberado enquanto a chave da InfinitePay ainda estiver como placeholder no `.env`.

## 📚 Recursos Adicionais

- [Discord.js Documentação](https://discord.js.org/)
- [Prisma Documentação](https://www.prisma.io/docs/)
- [PostgreSQL Documentação](https://www.postgresql.org/docs/)
- [Docker Documentação](https://docs.docker.com/)

---

**Desenvolvido com ❤️ para o Discord**
