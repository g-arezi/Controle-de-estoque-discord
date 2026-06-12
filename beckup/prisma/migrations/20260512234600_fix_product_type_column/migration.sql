-- Convert products.type from enum to varchar to support dynamic product types
ALTER TABLE "products"
ALTER COLUMN "type" DROP DEFAULT,
ALTER COLUMN "type" TYPE VARCHAR(50) USING "type"::text,
ALTER COLUMN "type" SET DEFAULT 'DIGITAL';

-- The old enum type is no longer needed after converting the column.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ProductType') THEN
        DROP TYPE "ProductType";
    END IF;
END $$;
