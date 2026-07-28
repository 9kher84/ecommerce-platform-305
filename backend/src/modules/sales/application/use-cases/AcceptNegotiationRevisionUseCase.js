const { CommercialProcess, NegotiationSheet, sequelize } = require('../../../../../sequelize_setup');

class AcceptNegotiationRevisionUseCase {
  async execute({ commercialProcessId, userId }) {
    const transaction = await sequelize.transaction();
    try {
      const process = await CommercialProcess.findByPk(commercialProcessId, { 
        transaction,
        lock: transaction.LOCK.UPDATE 
      });
      if (!process) throw new Error('CommercialProcess not found');
      if (process.status !== 'waiting_buyer' && process.status !== 'waiting_seller') {
        throw new Error(`Cannot accept process in status: ${process.status}`);
      }

      const activeSheet = await NegotiationSheet.findOne({
        where: { commercialProcessId, status: 'PENDING' },
        order: [['version', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (!activeSheet) throw new Error('No active sheet to accept');

      // Update Sheet
      activeSheet.status = 'ACCEPTED';
      activeSheet.decision = 'FINAL';
      await activeSheet.save({ transaction });

      // Update Process
      process.status = 'pending_award';
      await process.save({ transaction });

      // Record EventLog
      const { appendEventLog } = require('../../../../../services/eventLogService');
      await appendEventLog({
        actorId: userId,
        actorRole: 'BUYER', // Accept is done by buyer in this context
        entityType: 'CommercialProcess',
        entityId: process.id,
        actionType: 'NEGOTIATION_ACCEPTED',
        beforeState: { status: 'waiting_buyer' },
        afterState: { status: 'pending_award' },
        ipAddress: '127.0.0.1',
        userAgent: 'system'
      });

      await transaction.commit();
      return { process, activeSheet };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
module.exports = new AcceptNegotiationRevisionUseCase();
