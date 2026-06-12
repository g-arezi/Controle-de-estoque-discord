-- ============================================
-- Database Dump - discord_stock
-- Generated from prisma/schema.prisma & prisma/seed.ts
-- ============================================

-- Product Types
CREATE TABLE IF NOT EXISTS "product_types" (
    id VARCHAR(30) PRIMARY KEY DEFAULT ('type_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20)),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    emoji VARCHAR(10),
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS "products" (
    id VARCHAR(30) PRIMARY KEY DEFAULT ('prod_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20)),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'DIGITAL',
    "channelId" VARCHAR(30),
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS "orders" (
    id VARCHAR(30) PRIMARY KEY DEFAULT ('ord_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20)),
    "discordUserId" VARCHAR(30) NOT NULL,
    "discordUsername" VARCHAR(255) NOT NULL,
    "productId" VARCHAR(30) NOT NULL REFERENCES "products"(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "paymentId" VARCHAR(255),
    "paymentUrl" TEXT,
    "pixKey" TEXT,
    "expiresAt" TIMESTAMP,
    "completedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Rate Limits
CREATE TABLE IF NOT EXISTS "rate_limits" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "discordUserId" VARCHAR(30) NOT NULL,
    action VARCHAR(100) NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    "resetAt" TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE("discordUserId", action, "resetAt")
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "discordUserId" VARCHAR(30) NOT NULL,
    "discordUsername" VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    "entityId" VARCHAR(255),
    details TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_status ON "products"(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON "products"(category);
CREATE INDEX IF NOT EXISTS idx_products_channel_id ON "products"("channelId");
CREATE INDEX IF NOT EXISTS idx_orders_user ON "orders"("discordUserId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON "orders"(status);
CREATE INDEX IF NOT EXISTS idx_orders_product ON "orders"("productId");
CREATE INDEX IF NOT EXISTS idx_rate_limits_user ON "rate_limits"("discordUserId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON "audit_logs"("discordUserId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON "audit_logs"(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON "audit_logs"("createdAt");

-- ============================================
-- Seed Data - Product Types
-- ============================================
INSERT INTO "product_types" (name, emoji, description) VALUES
    ('ITEMS', '📦', 'Itens do jogo'),
    ('SKINS', '🎮', 'Skins e aparências'),
    ('CONTAS', '👤', 'Contas de serviços'),
    ('DIGITAL', '💾', 'Produtos digitais'),
    ('PHYSICAL', '📦', 'Produtos físicos')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Seed Data - Products
-- ============================================
INSERT INTO "products" (name, description, price, quantity, category, type, status, "imageUrl") VALUES
    ('Curso Python Completo', 'Aprenda Python do zero ao avançado com 50+ aulas práticas', 199.90, 999, 'Cursos', 'DIGITAL', 'ACTIVE', 'https://via.placeholder.com/300x200?text=Python+Course'),
    ('Mousepad RGB 40x30cm', 'Mousepad com iluminação RGB e base antiderrapante', 89.90, 20, 'Periféricos', 'PHYSICAL', 'ACTIVE', 'https://via.placeholder.com/300x200?text=Mousepad+RGB'),
    ('Ebook: Desenvolvimento Web', 'Guia completo de desenvolvimento web moderno', 49.90, 500, 'Ebooks', 'DIGITAL', 'ACTIVE', 'https://via.placeholder.com/300x200?text=Web+Development'),
    ('Teclado Mecânico RGB', 'Teclado mecânico com switches customizáveis', 349.90, 10, 'Periféricos', 'PHYSICAL', 'ACTIVE', 'https://via.placeholder.com/300x200?text=Keyboard'),
    ('Template de Website', 'Template HTML/CSS/JS pronto para uso', 29.90, 1000, 'Digitais', 'DIGITAL', 'ACTIVE', 'https://via.placeholder.com/300x200?text=Website+Template')
ON CONFLICT (id) DO NOTHING;
