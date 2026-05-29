DO $$ BEGIN
    CREATE TYPE "enum_PurchaseRequests_rfqStatus" AS ENUM ('draft', 'rfq_published', 'quoting', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "PurchaseRequests" ADD COLUMN IF NOT EXISTS "rfqStatus" "enum_PurchaseRequests_rfqStatus" DEFAULT 'draft';
