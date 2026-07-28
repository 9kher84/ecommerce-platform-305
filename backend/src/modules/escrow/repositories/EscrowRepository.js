const { Escrow: EscrowModel } = require('../../../../models');
const EscrowMapper = require('./mappers/EscrowMapper');
const ConcurrencyException = require('../../../shared/domain/ConcurrencyException');

class EscrowRepository {
  /**
   * @param {string} id
   * @param {import('sequelize').Transaction} [transaction]
   * @returns {Promise<import('../../domain/entities/Escrow')|null>}
   */
  async findById(id, transaction = null) {
    const row = await EscrowModel.findByPk(id, { transaction });
    return EscrowMapper.toDomain(row);
  }

  /**
   * Used for Idempotency check in Policy
   * @param {string} awardId 
   * @param {import('sequelize').Transaction} [transaction] 
   * @returns {Promise<import('../../domain/entities/Escrow')|null>}
   */
  async findByAwardId(awardId, transaction = null) {
    const row = await EscrowModel.findOne({ where: { awardId }, transaction });
    return EscrowMapper.toDomain(row);
  }

  /**
   * @param {import('../../domain/entities/Escrow')} escrow
   * @param {number} expectedVersion
   * @param {import('sequelize').Transaction} [transaction]
   */
  async store(escrow, expectedVersion = null, transaction = null) {
    const persistenceData = EscrowMapper.toPersistence(escrow);

    const existing = await EscrowModel.findByPk(escrow.id, { transaction });
    if (!existing) {
      // Create new
      await EscrowModel.create(persistenceData, { transaction });
    } else {
      // Update with Optimistic Locking
      if (expectedVersion !== null && existing.version !== expectedVersion) {
        throw new ConcurrencyException(
          `Escrow ${escrow.id} has been modified by another process. Expected version: ${expectedVersion}, Actual version: ${existing.version}`
        );
      }
      
      const [updatedRowsCount] = await EscrowModel.update(persistenceData, {
        where: {
          id: escrow.id,
          version: expectedVersion !== null ? expectedVersion : existing.version
        },
        transaction
      });

      if (updatedRowsCount === 0) {
        throw new ConcurrencyException(`Concurrency error updating Escrow ${escrow.id}`);
      }
    }
  }
}

module.exports = EscrowRepository;
