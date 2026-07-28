const TemplateRepositoryPort = require('../../application/ports/TemplateRepositoryPort');
const TemplateMapper = require('./mappers/TemplateMapper');
const ConcurrencyException = require('../../../../../../src/shared/domain/ConcurrencyException');

// Mock ORM dependency
// const { TemplateModel } = require('../../../../sequelize_setup');

class TemplateRepository extends TemplateRepositoryPort {
  
  async findById(id) {
    // const model = await TemplateModel.findByPk(id);
    // return TemplateMapper.toDomain(model);
    throw new Error("Not implemented");
  }

  async store(aggregate, expectedVersion, t) {
    const persistenceData = TemplateMapper.toPersistence(aggregate);
    
    if (aggregate.id) {
      // Update with Optimistic Lock
      // const [affectedRows] = await TemplateModel.update(persistenceData, { 
      //   where: { id: aggregate.id, version: expectedVersion }, 
      //   transaction: t 
      // });
      // if (affectedRows === 0) {
      //   throw new ConcurrencyException("TemplateAggregate", aggregate.id, expectedVersion, aggregate.version);
      // }
    } else {
      // Create new
      // const newModel = await TemplateModel.create(persistenceData, { transaction: t });
      // aggregate.id = newModel.id;
    }
  }
}

module.exports = TemplateRepository;
