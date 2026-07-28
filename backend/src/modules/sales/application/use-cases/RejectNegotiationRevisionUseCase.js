const { CommercialProcess, NegotiationSheet, sequelize } = require('../../../../../sequelize_setup');

class RejectNegotiationRevisionUseCase {
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

      if (!activeSheet) throw new Error('No active sheet to reject');

      // Update Sheet
      activeSheet.status = 'REJECTED';
      await activeSheet.save({ transaction });

      // Update Process
      process.status = 'closed';
      await process.save({ transaction });

      await transaction.commit();
      return { process, activeSheet };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
module.exports = new RejectNegotiationRevisionUseCase();
