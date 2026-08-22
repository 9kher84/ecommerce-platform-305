const PurchaseRequestRepositoryPort = require('../application/ports/PurchaseRequestRepositoryPort');
const { PurchaseRequest, User, Category } = require('../../../../sequelize_setup');
const PurchaseRequestAggregate = require('../domain/entities/PurchaseRequest');
const PurchaseRequestMapper = require('./mappers/PurchaseRequestMapper');

/**
 * ADAPTER: Sequelize Implementation of PurchaseRequestRepository
 */
class PurchaseRequestRepository extends PurchaseRequestRepositoryPort {
  async findById(id) {
    const request = await PurchaseRequest.findByPk(id, {
      include: [
        { model: User, as: "user", attributes: ["id", "name", "email", "subscriptionTier"] },
        { model: Category, as: "category", attributes: ["id", "name_ar", "name_en"] },
      ],
    });

    if (!request) {
      return null;
    }

    return PurchaseRequestMapper.toDomain(request);
  }

  async exists(id) {
    const count = await PurchaseRequest.count({ where: { id } });
    return count > 0;
  }

  nextIdentity() {
    const { v4: uuidv4 } = require('uuid');
    return uuidv4();
  }

  async findDraft(buyerId) {
    return PurchaseRequest.findAll({
      where: { userId: buyerId, status: 'draft' },
      include: [
        { model: User, as: "user", attributes: ["id", "name"] },
      ],
    });
  }

  async lock(id) {
    // In Sequelize, passing transaction and lock: true achieves row-level locking.
    // For this pilot without a Tx passed down yet, we return the entity.
    // Real implementation would require a transaction context.
    return this.findById(id);
  }

  async store(aggregate, expectedVersion, t) {
    const persistenceData = PurchaseRequestMapper.toPersistence(aggregate);
    
    // Check if it's a new aggregate
    if (expectedVersion === 0 || !expectedVersion) {
      // It's a new request
      await PurchaseRequest.create(persistenceData, { transaction: t });
      
      if (aggregate.items && aggregate.items.length > 0) {
        const { PurchaseRequestItem } = require('../../../../sequelize_setup');
        const itemsToInsert = aggregate.items.map(item => ({
          ...item,
          purchaseRequestId: aggregate.id
        }));
        await PurchaseRequestItem.bulkCreate(itemsToInsert, { transaction: t });
      }
      return;
    }

    const updateData = { 
      status: persistenceData.status,
      statusHistory: persistenceData.statusHistory,
      version: persistenceData.version,
      title: persistenceData.title,
      description: persistenceData.description,
      sectorId: persistenceData.sectorId,
      categoryId: persistenceData.categoryId,
      deliveryLocations: persistenceData.deliveryLocations,
      requiresDelivery: persistenceData.requiresDelivery,
      contactNumbers: persistenceData.contactNumbers,
      images: persistenceData.images,
      auction_type: persistenceData.auction_type,
      expiresAt: persistenceData.expiresAt,
      delivery_date: persistenceData.delivery_date,
      delivery_city: persistenceData.delivery_city,
      fixed_price: persistenceData.fixed_price,
      pricing_method: persistenceData.pricing_method,
      tender_type: persistenceData.tender_type
    };
    
    const [affectedRows] = await PurchaseRequest.update(updateData, { 
      where: { id: aggregate.id, version: expectedVersion }, 
      transaction: t 
    });

    if (affectedRows === 0) {
      const ConcurrencyException = require('../../../../shared/domain/ConcurrencyException');
      throw new ConcurrencyException("PurchaseRequest", aggregate.id, expectedVersion, aggregate.version);
    }

    // Handle items updates
    if (aggregate.items && aggregate.items.length > 0) {
      const { PurchaseRequestItem } = require('../../../../sequelize_setup');
      
      const promises = aggregate.items.map(item => {
        return PurchaseRequestItem.update(
          { status: item.status },
          { where: { id: item.id }, transaction: t }
        );
      });
      await Promise.all(promises);
    }
  }
}

module.exports = PurchaseRequestRepository;
