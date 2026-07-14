const { sequelize } = require("../../sequelize_setup");
const PreparationModule = require("./PreparationModule");
const ShipmentModule = require("./ShipmentModule");
const ReceiptModule = require("./ReceiptModule");

class FulfillmentService {
  /**
   * Facade for Fulfillment Engine
   */

  // --- PREPARATION ---
  static async startPreparation(poId, sellerUserId) {
    const transaction = await sequelize.transaction();
    try {
      const po = await PreparationModule.startPreparation(poId, sellerUserId, transaction);
      await transaction.commit();
      return po;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async markReadyToShip(poId, sellerUserId) {
    const transaction = await sequelize.transaction();
    try {
      const po = await PreparationModule.markReadyToShip(poId, sellerUserId, transaction);
      await transaction.commit();
      return po;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  // --- SHIPMENT ---
  static async createShipment(poId, sellerOrganizationId, sellerUserId, shipmentData) {
    const transaction = await sequelize.transaction();
    try {
      const shipment = await ShipmentModule.createShipment(poId, sellerOrganizationId, sellerUserId, shipmentData, transaction);
      await transaction.commit();
      return shipment;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async dispatchShipment(shipmentId, sellerUserId) {
    const transaction = await sequelize.transaction();
    try {
      const shipment = await ShipmentModule.dispatchShipment(shipmentId, sellerUserId, transaction);
      await transaction.commit();
      return shipment;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  // --- RECEIPT ---
  static async logReceipt(poId, buyerUserId, receiptData) {
    const transaction = await sequelize.transaction();
    try {
      const receipt = await ReceiptModule.logReceipt(poId, buyerUserId, receiptData, transaction);
      await transaction.commit();
      return receipt;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async acceptReceipt(receiptId, buyerUserId) {
    const transaction = await sequelize.transaction();
    try {
      const receipt = await ReceiptModule.acceptReceipt(receiptId, buyerUserId, transaction);
      await transaction.commit();
      return receipt;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

module.exports = FulfillmentService;
