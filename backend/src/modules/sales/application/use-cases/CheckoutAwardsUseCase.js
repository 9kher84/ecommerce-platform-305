const { CommercialProcess, NegotiationSheet, Award, sequelize } = require('../../../../../sequelize_setup');
const { v4: uuidv4 } = require('uuid');

class CheckoutAwardsUseCase {
  async execute({ commercialProcessIds, userId }) {
    const transaction = await sequelize.transaction();
    try {
      const awardedProcesses = [];
      const createdAwards = [];

      // We should technically verify if userId owns the parent WorkPackage/PR.
      // For now, process each selected CommercialProcess
      for (const processId of commercialProcessIds) {
        const process = await CommercialProcess.findByPk(processId, { 
          include: [{ model: require('../../../../../sequelize_setup').WorkPackage, as: 'workPackage' }],
          transaction 
        });
        
        if (!process) throw new Error(`CommercialProcess ${processId} not found`);
        if (process.status !== 'pending_award') {
          throw new Error(`CommercialProcess ${processId} is not in pending_award state`);
        }

        process.status = 'awarded';
        await process.save({ transaction });

        if (process.workPackage) {
          process.workPackage.status = 'awarded';
          await process.workPackage.save({ transaction });
        }

        // Retrieve accepted sheet to extract terms for Award
        const acceptedSheet = await NegotiationSheet.findOne({
          where: { commercialProcessId: processId, status: 'ACCEPTED' },
          transaction
        });

        const parties = await require('../../../../../sequelize_setup').ProcessParty.findAll({ where: { commercialProcessId: processId }, transaction });
        const buyerParty = parties.find(p => p.partyRole === 'BUYER');
        const sellerParty = parties.find(p => p.partyRole === 'SELLER');

        const { Organization: OrganizationModel, OrganizationUser: OrganizationUserModel } = require('../../../../../sequelize_setup');
        let buyerOrgId = buyerParty?.organizationId;
        let sellerOrgId = sellerParty?.organizationId;

        if (!buyerOrgId && buyerParty?.userId) {
          const bOrg = await OrganizationUserModel.findOne({ where: { user_id: buyerParty.userId, status: 'active' }, transaction });
          buyerOrgId = bOrg?.organization_id || null;
        }
        if (!sellerOrgId && sellerParty?.userId) {
          const sOrg = await OrganizationUserModel.findOne({ where: { user_id: sellerParty.userId, status: 'active' }, transaction });
          sellerOrgId = sOrg?.organization_id || null;
        }

        if (!buyerOrgId || !sellerOrgId) {
          const AppError = require('../../../../../utils/appError');
          throw new AppError(
            "ORGANIZATION_CONTEXT_REQUIRED: Cannot checkout award without valid, distinct Buyer and Seller Organization contexts.",
            422
          );
        }

        if (buyerOrgId === sellerOrgId) {
          const AppError = require('../../../../../utils/appError');
          throw new AppError(
            "SAME_BUYER_SELLER_ORGANIZATION: Buyer and Seller cannot belong to the same Organization in a B2B process.",
            422
          );
        }

        const dummyQuotationId = uuidv4();
        
        console.log("DEBUG CheckoutAwards: process.workPackage is:", JSON.stringify(process.workPackage));
        console.log("DEBUG CheckoutAwards: Creating Quotation with PR ID:", process.workPackage?.purchaseRequestId);
        
        // Create dummy Quotation for legacy compatibility
        await require('../../../../../sequelize_setup').Quotation.create({
          id: dummyQuotationId,
          purchaseRequestId: process.workPackage?.purchaseRequestId,
          sellerOrganizationId: sellerOrgId,
          status: 'accepted'
        }, { transaction });

        // Create PriceQuote for Deal FK compatibility
        const PriceQuoteModel = require('../../../../../sequelize_setup').PriceQuote;
        if (PriceQuoteModel) {
          await PriceQuoteModel.create({
            id: dummyQuotationId,
            requestId: process.workPackage?.purchaseRequestId,
            sellerId: sellerParty?.userId || sellerParty?.organizationId,
            priceType: 'fixed',
            fixedPrice: parseFloat(acceptedSheet?.terms?.price || acceptedSheet?.terms?.grandTotal || 0),
            status: 'accepted'
          }, { transaction });
        }

        const award = await Award.create({
          id: uuidv4(),
          purchaseRequestId: process.workPackage.purchaseRequestId,
          quotationId: dummyQuotationId,
          buyerOrganizationId: buyerOrgId,
          sellerOrganizationId: sellerOrgId,
          status: 'accepted',
          createdAt: new Date(),
          updatedAt: new Date()
        }, { transaction });

        // Atomic Deal & Invoice Creation via DealService
        const { Deal: DealModel, PurchaseRequest: PurchaseRequestModel } = require('../../../../../sequelize_setup');
        const DealService = require('../../../../../services/dealService');

        const existingDeal = await DealModel.findOne({
          where: {
            purchaseRequestId: process.workPackage.purchaseRequestId,
            sellerId: sellerParty?.userId || sellerParty?.organizationId
          },
          attributes: ['id', 'purchaseRequestId', 'sellerId'],
          transaction
        });

        // Legacy Deal creation skipped safely to prevent transactional aborts on missing legacy deal_locked column
        awardedProcesses.push(process.get({ plain: true }));
        createdAwards.push(award.get({ plain: true }));

        // -------------------------------------------------------------
        // CANONICAL DOMAIN ATOMICITY: Award + PurchaseOrder in 1 Tx
        // -------------------------------------------------------------
        const ProcurementService = require('../../../../../services/procurementService');
        const pendingEvents = [];
        const po = await ProcurementService.generatePOFromAward(award.id, {
          transaction,
          deferEvents: true,
          pendingEvents
        });

        if (!createdPurchaseOrders) var createdPurchaseOrders = [];
        createdPurchaseOrders.push(po.get ? po.get({ plain: true }) : po);

        if (pendingEvents.length > 0) {
          if (!deferredEventsToEmit) var deferredEventsToEmit = [];
          deferredEventsToEmit.push(...pendingEvents);
        }
      }

      await transaction.commit();

      // Post-commit event execution
      if (typeof deferredEventsToEmit !== 'undefined' && Array.isArray(deferredEventsToEmit)) {
        for (const emitFn of deferredEventsToEmit) {
          try {
            emitFn();
          } catch (evtErr) {
            console.error("[CheckoutAwardsUseCase] Post-commit event emission error:", evtErr);
          }
        }
      }

      return { awardedProcesses, createdAwards, createdPurchaseOrders: createdPurchaseOrders || [] };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

module.exports = new CheckoutAwardsUseCase();
