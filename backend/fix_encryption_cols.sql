-- Fix mismatches between model and schema
ALTER TABLE "PurchaseRequests" ALTER COLUMN "fixed_price" TYPE TEXT USING "fixed_price"::text;
ALTER TABLE "PurchaseRequests" ALTER COLUMN "contact_number" TYPE TEXT USING "contact_number"::text;
