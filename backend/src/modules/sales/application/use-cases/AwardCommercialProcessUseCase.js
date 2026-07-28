const { CommercialProcess, WorkPackage, Award, sequelize } = require('../../../../../sequelize_setup');
const { v4: uuidv4 } = require('uuid');

class AwardCommercialProcessUseCase {
  async execute({ commercialProcessId, userId }) {
    const transaction = await sequelize.transaction();
    try {
      const process = await CommercialProcess.findByPk(commercialProcessId, {
        include: [{ model: WorkPackage, as: 'workPackage' }],
        transaction
      });
      if (!process) throw new Error('CommercialProcess not found');

      if (process.status !== 'agreed') {
        throw new Error('Cannot award a process that is not agreed');
      }

      // Update Process
      process.status = 'awarded';
      await process.save({ transaction });

      // Update WorkPackage
      if (process.workPackage) {
        process.workPackage.status = 'awarded';
        await process.workPackage.save({ transaction });
      }

      // Create Award
      // Note: Full mapping requires linking the winning NegotiationSheet terms
      const award = await Award.create({
        id: uuidv4(),
        purchaseRequestId: process.workPackage.purchaseRequestId,
        status: 'draft',
        createdAt: new Date(),
        updatedAt: new Date(),
        // Needs proper mapping for supplier info
      }, { transaction });

      await transaction.commit();
      return { process, award };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}
module.exports = new AwardCommercialProcessUseCase();
