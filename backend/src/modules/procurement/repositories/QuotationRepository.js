const QuotationRepositoryPort = require('../application/ports/QuotationRepositoryPort');
const QuotationMapper = require('./mappers/QuotationMapper');
const { Quotation, QuotationItem } = require('../../../../sequelize_setup');
const ConcurrencyException = require('../../../shared/domain/ConcurrencyException');

class QuotationRepository extends QuotationRepositoryPort {
  
  async findById(id) {
    const model = await Quotation.findByPk(id, {
      include: [{ model: QuotationItem, as: "items" }]
    });
    return QuotationMapper.toDomain(model);
  }

  async findByRequestAndSeller(purchaseRequestId, sellerOrganizationId) {
    const models = await Quotation.findAll({
      where: { purchaseRequestId, sellerOrganizationId },
      include: [{ model: QuotationItem, as: "items" }]
    });
    return models.map(m => QuotationMapper.toDomain(m));
  }

  async store(aggregate, expectedVersion, t) {
    const persistenceData = QuotationMapper.toPersistence(aggregate);
    
    if (aggregate.id) {
      // Update existing Quotation with Optimistic Lock
      const [affectedRows] = await Quotation.update(persistenceData.quotation, { 
        where: { 
          id: aggregate.id,
          version: expectedVersion
        }, 
        transaction: t 
      });

      if (affectedRows === 0) {
        // If 0 rows affected, it either doesn't exist, or the version doesn't match
        throw new ConcurrencyException("Quotation", aggregate.id, expectedVersion, aggregate.version);
      }

      // Update items: destroy old and recreate new (simplest approach for MVP to maintain integrity)
      await QuotationItem.destroy({ where: { quotationId: aggregate.id }, transaction: t });
      
      if (persistenceData.items && persistenceData.items.length > 0) {
        const itemsToCreate = persistenceData.items.map(item => ({
          ...item,
          quotationId: aggregate.id
        }));
        const newItemsModels = await QuotationItem.bulkCreate(itemsToCreate, { transaction: t });
        aggregate.items.forEach((item, index) => {
          item.id = newItemsModels[index].id;
        });
      }
    } else {
      // Create new Quotation
      const newQuoteModel = await Quotation.create(persistenceData.quotation, { transaction: t });
      
      // Update Aggregate ID so the Domain knows its assigned ID
      aggregate.id = newQuoteModel.id;
      
      const itemsToCreate = persistenceData.items.map(item => ({
        ...item,
        quotationId: newQuoteModel.id
      }));

      const newItemsModels = await QuotationItem.bulkCreate(itemsToCreate, { transaction: t });
      
      // Update Aggregate item IDs
      aggregate.items.forEach((item, index) => {
        item.id = newItemsModels[index].id;
      });
    }
  }
}

module.exports = QuotationRepository;
