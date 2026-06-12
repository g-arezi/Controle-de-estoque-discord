# Backup - Discord Estoque Bot

Data do backup: 12/06/2026

## Arquivos incluídos

### Configuração
- `.dockerignore`
- `.env.example`
- `.gitignore`
- `docker-compose.yml`
- `Dockerfile`
- `package.json`
- `tsconfig.json`

### Banco de Dados
- `database_dump.sql` — Script SQL completo com schema + seed data
- `prisma/schema.prisma` — Schema do Prisma
- `prisma/seed.ts` — Seed com produtos e tipos padrão
- `prisma/migrations/` — Migrations do banco
  - `20260512233735_init/migration.sql`
  - `20260512234533_add_channel_and_product_types/migration.sql`
  - `20260512234600_fix_product_type_column/migration.sql`
  - `migration_lock.toml`

### Código Fonte (`src/`)
- `src/main.ts` — Entry point
- `src/config/env.ts` — Config de ambiente
- `src/config/prisma.ts` — Conexão Prisma
- `src/discord/commands.ts` — Comandos do bot
- `src/discord/interaction-handler.ts` — Handler de interações
- `src/discord/register-commands.ts` — Registro de comandos
- `src/lib/logger.ts` — Logger
- `src/lib/money.ts` — Utilitário de valores
- `src/services/audit.service.ts` — Auditoria
- `src/services/order.service.ts` — Pedidos
- `src/services/payment.service.ts` — Pagamentos
- `src/services/product-type.service.ts` — Tipos de produto
- `src/services/product.service.ts` — Produtos
- `src/services/rate-limit.service.ts` — Rate limit
- `src/services/ticket.service.ts` — Tickets de entrega
- `src/web/server.ts` — Servidor web

### Documentação
- `README.md` — Documentação original do projeto
- `lista-arquivos.md` — Este arquivo

---

## Como restaurar

1. Copie a pasta `beckup` para a nova máquina
2. Configure o `.env` baseado no `.env.example`
3. Execute `docker compose up -d --build` ou instalação manual
4. Para popular o banco: `npx prisma db seed` ou use `database_dump.sql`
