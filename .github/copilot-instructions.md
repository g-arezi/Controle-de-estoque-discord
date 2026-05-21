<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Discord Inventory Bot - Development Guidelines

### Project Overview

This is a professional Discord bot for inventory management with support for digital and physical product sales. Built with TypeScript, discord.js v14, Prisma, and PostgreSQL.

### Key Technologies

- **Runtime:** Node.js 18+
- **Language:** TypeScript (strict mode)
- **Discord Framework:** discord.js v14
- **ORM:** Prisma v5
- **Database:** PostgreSQL 16
- **HTTP Server:** Express 4
- **Containerization:** Docker & Docker Compose

### Project Structure

```
src/
├── main.ts                  # Application entry point
├── config/                  # Configuration
│   ├── env.ts              # Environment validation
│   └── prisma.ts           # Prisma client
├── discord/                # Discord.js integration
│   ├── commands.ts         # Slash command definitions
│   ├── interaction-handler.ts  # Command/button handlers
│   └── register-commands.ts    # Command registration
├── lib/                    # Utilities
│   ├── logger.ts           # JSON structured logging
│   └── money.ts            # Currency formatting
├── services/               # Business logic
│   ├── product.service.ts  # Product CRUD
│   ├── order.service.ts    # Order management
│   ├── payment.service.ts  # Payment processing
│   ├── rate-limit.service.ts   # Rate limiting
│   └── audit.service.ts    # Audit logging
└── web/                    # HTTP server
    └── server.ts           # Express app

prisma/
├── schema.prisma          # Database schema
├── migrations/            # DB migrations
└── seed.ts               # Sample data seed
```

### Development Rules

1. **TypeScript Strictness**
   - Use strict mode (tsconfig.json)
   - Avoid `any` types
   - Define explicit types for all functions

2. **Database Transactions**
   - Use Prisma's `$transaction` with `Serializable` isolation level
   - Prevents race conditions on inventory updates
   - Never skip transaction blocks for product quantity changes

3. **Rate Limiting**
   - Enforce 1 checkout per user per 30 seconds
   - Use rate-limit.service.ts for all user actions
   - Log rate limit violations

4. **Error Handling**
   - Always try-catch database operations
   - Log all errors with context using logger.ts
   - Return user-friendly error messages

5. **Validation**
   - Validate all command inputs
   - Check product existence before operations
   - Verify stock availability before order creation

6. **Logging**
   - Use structured JSON logging (logger.ts)
   - Log all product changes, orders, and admin actions
   - Include timestamps and user IDs

7. **Discord Commands**
   - Use slash commands only (no prefix commands)
   - Implement proper permission checks for admin commands
   - Defer replies for long-running operations

8. **Code Style**
   - Use async/await (no callbacks)
   - Follow camelCase naming
   - Add JSDoc comments for service functions
   - Keep functions focused and testable

### Common Tasks

**Add a New Command:**
1. Define in `src/discord/commands.ts`
2. Add handler in `src/discord/interaction-handler.ts`
3. Implement service logic in `src/services/`
4. Register with Discord in `src/discord/register-commands.ts`

**Add a Database Field:**
1. Update `prisma/schema.prisma`
2. Create migration: `npx prisma migrate dev --name description`
3. Update service functions
4. Update handlers if needed

**Add Admin Functionality:**
1. Add command to `src/discord/commands.ts`
2. Check permissions in handler
3. Log action with `audit.service.ts`
4. Update documentation

### Environment Variables

All required env vars are validated in `src/config/env.ts`. See `.env.example` for reference.

### Testing Commands

```bash
# Compile TypeScript
npm run build

# Start with Docker
docker compose up -d

# Seed database
npx prisma db seed

# View logs
docker compose logs app -f

# Access database
docker compose exec postgres psql -U discord -d discord_stock
```

### Important Notes

- Always use transactions for inventory operations
- Rate limiting is enforced at the service level
- All user actions are audited
- Expired orders automatically return stock after 10 minutes
- Payment integration is optional but stubbed out
