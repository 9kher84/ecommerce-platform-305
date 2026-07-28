const { CommercialProcess, NegotiationSheet, sequelize } = require('../../../../../sequelize_setup');
const { Op } = require('sequelize');

class ExpireNegotiationRevisionUseCase {
  // This would typically be called by a cron job or background worker
  async execute() {
    const transaction = await sequelize.transaction();
    try {
      const expiredSheets = await NegotiationSheet.findAll({
        where: {
          status: 'PENDING',
          validUntil: {
            [Op.lt]: new Date()
          }
        },
        transaction
      });

      for (const sheet of expiredSheets) {
        sheet.status = 'EXPIRED';
        await sheet.save({ transaction });

        const process = await CommercialProcess.findByPk(sheet.commercialProcessId, { transaction });
        if (process && !['agreed', 'awarded', 'closed'].includes(process.status)) {
          process.status = 'expired';
          await process.save({ transaction });
        }
      }

      await transaction.commit();
      return { expiredCount: expiredSheets.length };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
module.exports = new ExpireNegotiationRevisionUseCase();
