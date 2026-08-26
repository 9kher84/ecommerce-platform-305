"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add purchase_order_id, subtotal, vat_amount to invoices if not exists
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'invoices' AND column_name = 'purchase_order_id'
        ) THEN 
          ALTER TABLE "invoices" ADD COLUMN "purchase_order_id" UUID NULL REFERENCES "PurchaseOrders" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'invoices' AND column_name = 'subtotal'
        ) THEN 
          ALTER TABLE "invoices" ADD COLUMN "subtotal" DECIMAL(12, 2) NULL;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'invoices' AND column_name = 'vat_amount'
        ) THEN 
          ALTER TABLE "invoices" ADD COLUMN "vat_amount" DECIMAL(12, 2) NULL;
        END IF;
      END $$;
    `);

    // 2. Make deal_id nullable in invoices for B2B canonical path via raw SQL
    await queryInterface.sequelize.query(
      'ALTER TABLE "invoices" ALTER COLUMN "deal_id" DROP NOT NULL;'
    );

    // 3. Add 'paid' to enum_PurchaseOrders_businessStatus if not exists
    await queryInterface.sequelize.query(
      "ALTER TYPE \"enum_PurchaseOrders_businessStatus\" ADD VALUE IF NOT EXISTS 'paid';"
    );

    // 4. Update payment_transactions: drop NOT NULL on dealId/deal_id, add purchaseOrderId/purchase_order_id and invoiceId/invoice_id
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'dealId') THEN 
          ALTER TABLE "payment_transactions" ALTER COLUMN "dealId" DROP NOT NULL;
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'deal_id') THEN 
          ALTER TABLE "payment_transactions" ALTER COLUMN "deal_id" DROP NOT NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'purchaseOrderId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'purchase_order_id') THEN 
          ALTER TABLE "payment_transactions" ADD COLUMN "purchaseOrderId" UUID NULL REFERENCES "PurchaseOrders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'invoiceId') AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'invoice_id') THEN 
          ALTER TABLE "payment_transactions" ADD COLUMN "invoiceId" INTEGER NULL REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    // 5. Create invoice_lines table
    await queryInterface.createTable("invoice_lines", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        primaryKey: true,
      },
      invoice_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "invoices",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      purchase_order_line_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "PurchaseOrderLines",
          key: "id",
        },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      receipt_line_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "ReceiptLines",
          key: "id",
        },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      invoiced_quantity: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      unit_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // 6. Add Indexes safely
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_invoices_purchase_order_id" ON "invoices" ("purchase_order_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_invoice_lines_invoice_id" ON "invoice_lines" ("invoice_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_invoice_lines_purchase_order_line_id" ON "invoice_lines" ("purchase_order_line_id");');
    await queryInterface.sequelize.query('CREATE INDEX IF NOT EXISTS "idx_invoice_lines_receipt_line_id" ON "invoice_lines" ("receipt_line_id");');
  },

  down: async (queryInterface, Sequelize) => {
    // 1. Drop invoice_lines table if exists
    await queryInterface.dropTable("invoice_lines");

    // 2. Remove purchase_order_id, subtotal, vat_amount columns from invoices if exists
    await queryInterface.sequelize.query(
      'ALTER TABLE "invoices" DROP COLUMN IF EXISTS "purchase_order_id", DROP COLUMN IF EXISTS "subtotal", DROP COLUMN IF EXISTS "vat_amount";'
    );

    // 3. Restore deal_id NOT NULL constraint via raw SQL
    await queryInterface.sequelize.query(
      'ALTER TABLE "invoices" ALTER COLUMN "deal_id" SET NOT NULL;'
    );

    // 4. Remove purchaseOrderId and invoiceId columns from payment_transactions if exists
    await queryInterface.sequelize.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'purchaseOrderId') THEN 
          ALTER TABLE "payment_transactions" DROP COLUMN "purchaseOrderId";
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'purchase_order_id') THEN 
          ALTER TABLE "payment_transactions" DROP COLUMN "purchase_order_id";
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'invoiceId') THEN 
          ALTER TABLE "payment_transactions" DROP COLUMN "invoiceId";
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payment_transactions' AND column_name = 'invoice_id') THEN 
          ALTER TABLE "payment_transactions" DROP COLUMN "invoice_id";
        END IF;
      END $$;
    `);
  },
};
