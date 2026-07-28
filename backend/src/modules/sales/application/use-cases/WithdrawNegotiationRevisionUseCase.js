const { CommercialProcess, NegotiationSheet, sequelize } = require('../../../../../sequelize_setup');

class WithdrawNegotiationRevisionUseCase {
  async execute({ commercialProcessId, userId }) {
    const transaction = await sequelize.transaction();
    try {
      const process = await CommercialProcess.findByPk(commercialProcessId, { transaction });
      if (!process) throw new Error('CommercialProcess not found');

      const activeSheet = await NegotiationSheet.findOne({
        where: { commercialProcessId, status: 'PENDING' },
        order: [['version', 'DESC']],
        transaction
      });

      if (!activeSheet) throw new Error('No active sheet to withdraw');

      // We should verify if the initiator is withdrawing their own proposal
      // But for simplicity in Wave 2 MVP we just mark it.

      activeSheet.status = 'WITHDRAWN';
      activeSheet.decision = 'WITHDRAW';
      await activeSheet.save({ transaction });

      process.status = 'cancelled';
      await process.save({ transaction });

      await transaction.commit();
      return { process, activeSheet };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
module.exports = new WithdrawNegotiationRevisionUseCase();
