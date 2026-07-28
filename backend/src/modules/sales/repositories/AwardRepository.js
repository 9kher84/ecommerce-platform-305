const AwardRepositoryPort = require('../application/ports/AwardRepositoryPort');
const { Award: AwardModel, AwardLine: AwardLineModel } = require('../../../../sequelize_setup');
const AwardMapper = require('./mappers/AwardMapper');
const ConcurrencyException = require('../../../shared/domain/ConcurrencyException');

class AwardRepository extends AwardRepositoryPort {
  async findById(id) {
    const record = await AwardModel.findByPk(id, {
      include: [{ model: AwardLineModel, as: 'lines' }]
    });

    if (!record) return null;
    return AwardMapper.toDomain(record);
  }

  async store(aggregate, expectedVersion, t) {
    const data = AwardMapper.toPersistence(aggregate);

    // If it's a new aggregate (version 1 and creating), we use create. 
    // We can check if it exists or use an upsert strategy.
    // For pure DDD: if expectedVersion === 0 (or null) it means create.
    // Assuming expectedVersion = 0 means new record:
    if (!expectedVersion || expectedVersion === 0) {
      await AwardModel.create({ ...data, version: 1 }, { transaction: t });
      
      if (data.lines && data.lines.length > 0) {
        await AwardLineModel.bulkCreate(data.lines, { transaction: t });
      }
      return;
    }

    // Otherwise, Update with Optimistic Locking
    const [affectedRows] = await AwardModel.update(
      {
        status: data.status,
        totalAmount: data.totalAmount,
        notes: data.notes,
        version: data.version
      },
      {
        where: { id: aggregate.id, version: expectedVersion },
        transaction: t
      }
    );

    if (affectedRows === 0) {
      throw new ConcurrencyException("Award", aggregate.id, expectedVersion, aggregate.version);
    }

    // Handle Lines: since this is a minimal slice, we can just upsert lines or bulkCreate if they don't exist.
    // In many models lines are immutable after creation, or we can use an upsert approach.
    if (data.lines && data.lines.length > 0) {
      await AwardLineModel.bulkCreate(data.lines, {
        updateOnDuplicate: ['quantityAwarded', 'unitPriceAwarded', 'notes', 'status'], // Adapt to fields
        transaction: t
      });
    }
  }
}

module.exports = AwardRepository;
