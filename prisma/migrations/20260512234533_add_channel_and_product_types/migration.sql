-- CreateTable ProductTypeConfig
CREATE TABLE "product_types" (
    "id" TEXT NOT NULL DEFAULT 'type_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20),
    "name" VARCHAR(50) NOT NULL,
    "emoji" VARCHAR(10),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_types_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_types_name_key" ON "product_types"("name");

-- AlterTable
ALTER TABLE "products" ADD COLUMN "channelId" VARCHAR(30);

-- CreateIndex
CREATE INDEX "products_channelId_idx" ON "products"("channelId");

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "id" SET DEFAULT 'ord_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20);

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "id" SET DEFAULT 'prod_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20);
