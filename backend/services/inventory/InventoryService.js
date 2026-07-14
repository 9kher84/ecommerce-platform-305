const { eventBus } = require("../../utils/EventBus");
const { SmartInventory, PurchaseOrder, PurchaseOrderLine, Shipment, ShipmentLine, Receipt, ReceiptLine, ProductDNA } = require("../../sequelize_setup");

class InventoryService {

  static async getProductIdByDNA(productDNAId, sellerOrganizationId) {
    if (!productDNAId) return null;
    const { Product } = require("../../sequelize_setup");
    const product = await Product.findOne({ where: { productDNAId, ownerOrganizationId: sellerOrganizationId } });
    return product ? product.id : null;
  }

  static async applyTransaction(productId, organizationId, direction, reason, quantity, referenceType, referenceId) {
    const { sequelize, SmartInventory, InventoryTransaction } = require("../../sequelize_setup");
    
    return await sequelize.transaction(async (t) => {
      let inv = await SmartInventory.findOne({ where: { productId, sellerId: organizationId }, transaction: t });
      if (!inv) {
        inv = await SmartInventory.create({
          productId,
          sellerId: organizationId,
          availableQuantity: 1000 // Seed with 1000 for test purposes
        }, { transaction: t });
      }

      const balanceBefore = {
        available: inv.availableQuantity,
        reserved: inv.reservedQuantity,
        allocated: inv.allocatedQuantity,
        inTransit: inv.inTransitQuantity,
        quarantine: inv.quarantineQuantity
      };

      const balanceAfter = { ...balanceBefore };
      
      // Calculate new balances based on reason
      switch (reason) {
        case "RESERVE":
          balanceAfter.available -= quantity;
          balanceAfter.reserved += quantity;
          break;
        case "ALLOCATE":
          balanceAfter.reserved = Math.max(0, balanceAfter.reserved - quantity);
          balanceAfter.allocated += quantity;
          break;
        case "SHIP":
          balanceAfter.allocated = Math.max(0, balanceAfter.allocated - quantity);
          balanceAfter.inTransit += quantity;
          break;
        case "RECEIVE":
          balanceAfter.inTransit = Math.max(0, balanceAfter.inTransit - quantity);
          break;
        case "QUARANTINE":
          balanceAfter.inTransit = Math.max(0, balanceAfter.inTransit - quantity);
          balanceAfter.quarantine += quantity;
          break;
        case "RETURN":
        case "ADJUSTMENT":
          break;
      }

      await InventoryTransaction.create({
        productId,
        organizationId,
        direction,
        reason,
        quantity,
        balanceBefore,
        balanceAfter,
        referenceType,
        referenceId
      }, { transaction: t });

      await inv.update({
        availableQuantity: balanceAfter.available,
        reservedQuantity: balanceAfter.reserved,
        allocatedQuantity: balanceAfter.allocated,
        inTransitQuantity: balanceAfter.inTransit,
        quarantineQuantity: balanceAfter.quarantine
      }, { transaction: t });
      
      return inv;
    });
  }

  static initialize() {
    eventBus.on("PO_ACCEPTED", async (event) => {
      try {
        const po = await PurchaseOrder.findByPk(event.aggregateId, { include: "lines" });
        if (!po) return;
        
        for (const line of po.lines) {
          const productId = await this.getProductIdByDNA(line.productDNAId, po.sellerOrganizationId);
          if (productId) {
            await this.applyTransaction(productId, po.sellerOrganizationId, "NONE", "RESERVE", parseFloat(line.quantity), "PurchaseOrder", po.id);
          }
        }
      } catch (err) {
        console.error("[InventoryService] Error on PO_ACCEPTED", err);
      }
    });

    eventBus.on("PO_PREPARATION_STARTED", async (event) => {
      try {
        const po = await PurchaseOrder.findByPk(event.aggregateId, { include: "lines" });
        if (!po) return;

        for (const line of po.lines) {
          const productId = await this.getProductIdByDNA(line.productDNAId, po.sellerOrganizationId);
          if (productId) {
            await this.applyTransaction(productId, po.sellerOrganizationId, "NONE", "ALLOCATE", parseFloat(line.quantity), "PurchaseOrder", po.id);
          }
        }
      } catch (err) {
        console.error("[InventoryService] Error on PO_PREPARATION_STARTED", err);
      }
    });

    eventBus.on("SHIPMENT_DISPATCHED", async (event) => {
      try {
        const shipment = await Shipment.findByPk(event.aggregateId, { 
          include: [{ model: ShipmentLine, as: "lines", include: ["purchaseOrderLine"] }] 
        });
        if (!shipment) return;

        for (const line of shipment.lines) {
          const productId = await this.getProductIdByDNA(line.purchaseOrderLine.productDNAId, shipment.sellerOrganizationId);
          if (productId) {
            await this.applyTransaction(productId, shipment.sellerOrganizationId, "OUT", "SHIP", parseFloat(line.quantityShipped), "Shipment", shipment.id);
          }
        }
      } catch (err) {
        console.error("[InventoryService] Error on SHIPMENT_DISPATCHED", err);
      }
    });

    eventBus.on("RECEIPT_ACCEPTED", async (event) => {
      try {
        const receipt = await Receipt.findByPk(event.aggregateId, { 
          include: [{ model: ReceiptLine, as: "lines", include: ["purchaseOrderLine"] }, "purchaseOrder"] 
        });
        if (!receipt) return;

        for (const line of receipt.lines) {
          const productId = await this.getProductIdByDNA(line.purchaseOrderLine.productDNAId, receipt.purchaseOrder.sellerOrganizationId);
          
          if (productId) {
            const acceptedQty = parseFloat(line.acceptedQuantity) || 0;
            const quarantineQty = (parseFloat(line.damagedQuantity) || 0) + (parseFloat(line.rejectedQuantity) || 0);

            if (acceptedQty > 0) {
              await this.applyTransaction(productId, receipt.purchaseOrder.sellerOrganizationId, "OUT", "RECEIVE", acceptedQty, "Receipt", receipt.id);
            }
            if (quarantineQty > 0) {
              await this.applyTransaction(productId, receipt.purchaseOrder.sellerOrganizationId, "NONE", "QUARANTINE", quarantineQty, "Receipt", receipt.id);
            }
          }
        }
      } catch (err) {
        console.error("[InventoryService] Error on RECEIPT_ACCEPTED", err);
      }
    });

    console.log("[InventoryService] Initialized and listening to EventBus.");
  }
}

module.exports = InventoryService;
