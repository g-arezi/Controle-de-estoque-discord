# 🚀 Quick Start - Discord Inventory Bot

## ⚡ Primeiros Passos

### 1. Configurar o Arquivo `.env`

Copie o arquivo `.env.example` e renomeie para `.env`:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha com seus dados:

```env
# Discord
DISCORD_TOKEN=seu_token_do_bot
DISCORD_CLIENT_ID=seu_client_id
ESTOQUE_CHANNEL_ID=seu_channel_id

# PostgreSQL (se usar Docker, deixe como está)
POSTGRES_USER=discord
POSTGRES_PASSWORD=discord123
POSTGRES_DB=discord_stock
DATABASE_URL=postgresql://discord:discord123@postgres:5432/discord_stock?schema=public

# Servidor
PORT=3000
```

### 2. Obter o Discord Token

1. Acesse [Discord Developer Portal](https://discord.com/developers/applications)
2. Clique em "New Application"
3. Vá em "Bot" → "Add Bot"
4. Copie o token em "TOKEN"
5. Ative as Permissões:
   - ✓ Send Messages
   - ✓ Embed Links
   - ✓ Attach Files
   - ✓ Use Slash Commands

### 3. Obter Channel ID e Guild ID

1. Ative Developer Mode no Discord: **User Settings** → **Advanced** → **Developer Mode**
2. Clique direito no canal/servidor
3. Copie o ID

### 4. Iniciar com Docker (Recomendado)

```bash
# Build e inicie tudo
docker compose up -d --build

# Veja os logs
docker compose logs app -f

# Aguarde até aparecer "✅ Bot conectado"
```

### 5. Seedar Dados (Opcional)

Se quiser dados de teste:

```bash
docker compose exec app npm run prisma:seed
```

### 6. Testar o Bot

No Discord:

```
/menu
```

Se aparecer o menu, o bot está funcionando! 🎉

---

## 🔧 Instalação Manual (Sem Docker)

### Pré-requisitos

- Node.js 18+
- PostgreSQL 16+
- npm ou yarn

### Passos

```bash
# 1. Instale as dependências
npm install

# 2. Configure o .env (veja acima)

# 3. Rode as migrações
npx prisma migrate deploy

# 4. (Opcional) Rode o seed
npx prisma db seed

# 5. Compile o TypeScript
npm run build

# 6. Inicie o bot
npm start
```

---

## 📝 Comandos Úteis

```bash
# Ver logs
docker compose logs app -f

# Acessar PostgreSQL
docker compose exec postgres psql -U discord -d discord_stock

# Reiniciar o bot
docker compose restart app

# Parar tudo
docker compose down

# Removar containers e volumes
docker compose down -v
```

---

## ❌ Troubleshooting

### Bot não aparece online

```bash
# Reinicie
docker compose restart app

# Verifique logs
docker compose logs app -f
```

### "Cannot find module" error

```bash
# Limpe e reinstale
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Erro de banco de dados

```bash
# Verifique conexão
docker compose exec postgres psql -U discord -d discord_stock -c "SELECT 1"

# Ou reinicie tudo
docker compose down -v
docker compose up -d --build
```

---

## 📚 Próximos Passos

1. Configure seus produtos em `/estoque adicionar`
2. Compartilhe `/menu` com seus usuários
3. Monitore vendas em `docker compose logs app -f`
4. Configure webhooks de pagamento (opcional)

---

**Dúvidas?** Consulte o [README.md](README.md) para documentação completa.
