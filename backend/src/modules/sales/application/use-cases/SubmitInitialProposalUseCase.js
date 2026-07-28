const { CommercialProcess, ProcessParty, NegotiationSheet, WorkPackage, PurchaseRequest, sequelize } = require('../../../../../sequelize_setup');
const { v4: uuidv4 } = require('uuid');

class SubmitInitialProposalUseCase {
  async execute({ workPackageId, sellerUserId, sellerOrganizationId, terms, notes, validUntil }) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Validate WorkPackage
      const workPackage = await WorkPackage.findByPk(workPackageId, {
        include: [{ model: PurchaseRequest, as: 'purchaseRequest' }],
        transaction
      });

      if (!workPackage) {
        throw new Error('WorkPackage not found');
      }

      if (workPackage.status !== 'open') {
        throw new Error('WorkPackage is not open for new proposals');
      }

      // 2. Prevent duplicate active negotiations for the same seller on this package
      const existingProcess = await CommercialProcess.findOne({
        where: { workPackageId, processType: 'NEGOTIATION' },
        include: [{
          model: ProcessParty,
          as: 'parties',
          where: { userId: sellerUserId, partyRole: 'SELLER' }
        }],
        transaction
      });

      if (existingProcess) {
        throw new Error('Seller already has an active negotiation for this WorkPackage');
      }

      // 3. Create CommercialProcess
      const process = await CommercialProcess.create({
        id: uuidv4(),
        workPackageId,
        processType: 'NEGOTIATION',
        status: 'waiting_buyer',
      }, { transaction });

      // 4. Create Parties
      const buyerUserId = workPackage.purchaseRequest.userId;
      const buyerOrgId = workPackage.purchaseRequest.organization_id;

      await ProcessParty.create({
        id: uuidv4(),
        commercialProcessId: process.id,
        userId: buyerUserId,
        organizationId: buyerOrgId,
        partyRole: 'BUYER'
      }, { transaction });

      const sellerParty = await ProcessParty.create({
        id: uuidv4(),
        commercialProcessId: process.id,
        userId: sellerUserId,
        organizationId: sellerOrganizationId,
        partyRole: 'SELLER'
      }, { transaction });

      // 5. Create V1 NegotiationSheet
      const sheet = await NegotiationSheet.create({
        id: uuidv4(),
        commercialProcessId: process.id,
        initiatorPartyId: sellerParty.id,
        version: 1,
        decision: 'PROPOSAL',
        terms: terms || {},
        notes: notes ? notes.substring(0, 300) : null,
        validUntil: validUntil || null,
        status: 'PENDING'
      }, { transaction });

      await transaction.commit();

      return { process, sheet };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new SubmitInitialProposalUseCase();
