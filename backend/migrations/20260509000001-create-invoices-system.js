"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create invoices table
    await queryInterface.createTable("invoices", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      uuid: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
        unique: true,
        allowNull: false,
      },
      deal_id: {
        type: Sequelize.UUID, // Note: deals.id is UUID in this project based on Deal.js
        allowNull: false,
        references: {
          model: "deals",
          key: "id",
        },
        onDelete: "RESTRICT",
      },
      buyer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      seller_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      invoice_number: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false,
      },
      token: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: false,
      },
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: "pending", // pending, paid, partially_paid, overdue, cancelled, disputed, awaiting_confirmation, delivered
      },
      issue_date: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      due_date: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      auto_cancel_date: {
        type: Sequelize.DATE,
      },
      total_amount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      tax_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
      },
      discount_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
      },
      paid_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: "SAR",
      },
      items: {
        type: Sequelize.JSONB,
        allowNull: false,
      },
      buyer_snapshot: {
        type: Sequelize.JSONB,
      },
      seller_snapshot: {
        type: Sequelize.JSONB,
      },
      delivery_proof: {
        type: Sequelize.JSONB,
      },
      payment_proof: {
        type: Sequelize.JSONB,
      },
      notes: {
        type: Sequelize.TEXT,
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    await queryInterface.addIndex("invoices", ["deal_id"], {
      name: "idx_invoices_deal_id",
    });
    await queryInterface.addIndex("invoices", ["token"], {
      name: "idx_invoices_token",
    });
    await queryInterface.addIndex("invoices", ["status"], {
      name: "idx_invoices_status",
    });
    await queryInterface.addIndex("invoices", ["due_date"], {
      name: "idx_invoices_due_date",
    });

    // 2. Add columns to deals
    try {
      await queryInterface.addColumn("deals", "invoice_id", {
        type: Sequelize.INTEGER,
        references: {
          model: "invoices",
          key: "id",
        },
        onDelete: "SET NULL",
      });
    } catch (e) {
      console.log("invoice_id already exists in deals");
    }

    try {
      await queryInterface.addColumn("deals", "deal_locked", {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      });
    } catch (e) {
      console.log("deal_locked already exists in deals");
    }

    // 3. Add column to commission_transactions
    try {
      await queryInterface.addColumn("commission_transactions", "invoice_id", {
        type: Sequelize.INTEGER,
        references: {
          model: "invoices",
          key: "id",
        },
        onDelete: "SET NULL",
      });
    } catch (e) {
      console.log("invoice_id already exists in commission_transactions");
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("commission_transactions", "invoice_id");
    await queryInterface.removeColumn("deals", "deal_locked");
    await queryInterface.removeColumn("deals", "invoice_id");
    await queryInterface.dropTable("invoices");
  },
};
