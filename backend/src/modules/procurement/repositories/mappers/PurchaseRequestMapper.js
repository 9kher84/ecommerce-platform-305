const PurchaseRequestAggregate = require('../../domain/entities/PurchaseRequest');

/**
 * MAPPER: Translates between Sequelize Models and Domain Aggregates
 */
class PurchaseRequestMapper {
  /**
   * Converts a Sequelize Model instance into a Domain Aggregate
   * @param {Object} sequelizeModel
   * @returns {PurchaseRequestAggregate}
   */
  static toDomain(sequelizeModel) {
    if (!sequelizeModel) return null;

    return new PurchaseRequestAggregate({
      id: sequelizeModel.id,
      userId: sequelizeModel.userId,
      sectorId: sequelizeModel.sectorId,
      status: sequelizeModel.status,
      rfqStatus: sequelizeModel.rfqStatus,
      statusHistory: sequelizeModel.getDataValue ? sequelizeModel.getDataValue('statusHistory') : sequelizeModel.statusHistory,
      version: sequelizeModel.version,
      items: sequelizeModel.items || [],
      invitations: sequelizeModel.invitations || [],
      auction_type: sequelizeModel.auction_type,
      expiresAt: sequelizeModel.expiresAt,
      title: sequelizeModel.title,
      description: sequelizeModel.description,
      deliveryLocations: sequelizeModel.deliveryLocations || [],
      requiresDelivery: sequelizeModel.requiresDelivery,
      contactNumbers: sequelizeModel.contactNumbers || [],
      images: sequelizeModel.images || [],
      delivery_date: sequelizeModel.delivery_date,
      delivery_city: sequelizeModel.delivery_city,
      fixed_price: sequelizeModel.fixed_price,
      pricing_method: sequelizeModel.pricing_method,
      tender_type: sequelizeModel.tender_type,
    });
  }

  /**
   * Extracts persistence data from the Domain Aggregate
   * @param {PurchaseRequestAggregate} aggregate
   * @returns {Object} Plain object for Sequelize update/create
   */
  static toPersistence(aggregate) {
    return {
      id: aggregate.id,
      userId: aggregate.userId,
      sectorId: aggregate.sectorId,
      categoryId: aggregate.categoryId || aggregate.sectorId,
      status: aggregate.status,
      rfqStatus: aggregate.rfqStatus,
      statusHistory: aggregate.statusHistory,
      version: aggregate.version,
      title: aggregate.title,
      description: aggregate.description,
      deliveryLocations: aggregate.deliveryLocations,
      requiresDelivery: aggregate.requiresDelivery,
      contactNumbers: aggregate.contactNumbers,
      images: aggregate.images,
      auction_type: aggregate.auction_type,
      expiresAt: aggregate.expiresAt,
      delivery_date: aggregate.delivery_date,
      delivery_city: aggregate.delivery_city,
      fixed_price: aggregate.fixed_price,
      pricing_method: aggregate.pricing_method,
      tender_type: aggregate.tender_type,
    };
  }
}

module.exports = PurchaseRequestMapper;
