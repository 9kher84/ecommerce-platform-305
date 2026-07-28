const { Payment: PaymentModel } = require('../../../../models');
const PaymentMapper = require('./mappers/PaymentMapper');
const ConcurrencyException = require('../../../shared/domain/ConcurrencyException');

class PaymentRepository {
  /**
   * @param {string} id
   * @param {import('sequelize').Transaction} [transaction]
   * @returns {Promise<import('../../domain/entities/Payment')|null>}
   */
  async findById(id, transaction = null) {
    const row = await PaymentModel.findByPk(id, { transaction });
    return PaymentMapper.toDomain(row);
  }

  /**
   * Used for Idempotency check in Policy
   * @param {string} escrowId 
   * @param {import('sequelize').Transaction} [transaction] 
   * @returns {Promise<import('../../domain/entities/Payment')|null>}
   */
  async findByEscrowId(escrowId, transaction = null) {
    const row = await PaymentModel.findOne({ where: { escrowId }, transaction });
    return PaymentMapper.toDomain(row);
  }

  /**
   * @param {import('../../domain/entities/Payment')} payment
   * @param {number} expectedVersion
   * @param {import('sequelize').Transaction} [transaction]
   */
  async store(payment, expectedVersion = null, transaction = null) {
    const persistenceData = PaymentMapper.toPersistence(payment);

    const existing = await PaymentModel.findByPk(payment.id, { transaction });
    if (!existing) {
      // Create new
      await PaymentModel.create(persistenceData, { transaction });
    } else {
      // Update with Optimistic Locking
      if (expectedVersion !== null && existing.version !== expectedVersion) {
        throw new ConcurrencyException(
          `Payment ${payment.id} has been modified by another process. Expected version: ${expectedVersion}, Actual version: ${existing.version}`
        );
      }
      
      const [updatedRowsCount] = await PaymentModel.update(persistenceData, {
        where: {
          id: payment.id,
          version: expectedVersion !== null ? expectedVersion : existing.version
        },
        transaction
      });

      if (updatedRowsCount === 0) {
        throw new ConcurrencyException(`Concurrency error updating Payment ${payment.id}`);
      }
    }
  }
}

module.exports = PaymentRepository;
