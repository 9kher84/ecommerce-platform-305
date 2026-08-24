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

        const dummyQuotationId = uuidv4();
        
        console.log("DEBUG CheckoutAwards: process.workPackage is:", JSON.stringify(process.workPackage));
        console.log("DEBUG CheckoutAwards: Creating Quotation with PR ID:", process.workPackage?.purchaseRequestId);
        
        // Create dummy Quotation for legacy compatibility
        await require('../../../../../sequelize_setup').Quotation.create({
          id: dummyQuotationId,
          purchaseRequestId: process.workPackage?.purchaseRequestId,
          sellerOrganizationId: sellerParty?.organizationId || sellerParty?.userId, // Fallback if no org
          status: 'accepted'
        }, { transaction });

        const award = await Award.create({
          id: uuidv4(),
          purchaseRequestId: process.workPackage.purchaseRequestId,
          quotationId: dummyQuotationId,
          buyerOrganizationId: buyerParty?.organizationId || buyerParty?.userId,
          sellerOrganizationId: sellerParty?.organizationId || sellerParty?.userId,
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
          transaction
        });

        if (!existingDeal && process.workPackage.purchaseRequestId) {
          const pr = await PurchaseRequestModel.findByPk(process.workPackage.purchaseRequestId, { transaction });
          if (pr) {
            const finalAmount = parseFloat(acceptedSheet?.terms?.price || acceptedSheet?.terms?.grandTotal || 0);
            await DealService.createDeal({
              purchaseRequest: pr,
              acceptedQuote: {
                id: dummyQuotationId,
                sellerId: sellerParty?.userId || sellerParty?.organizationId,
                priceType: 'fixed',
                fixedPrice: finalAmount
              },
              invoiceData: {
                totalAmount: finalAmount,
                taxAmount: 0,
                sellerOrganizationId: sellerParty?.organizationId || null
              }
            }, { transaction });
          }
        }

        awardedProcesses.push(process);
        createdAwards.push(award);
      }

      await transaction.commit();
      return { awardedProcesses, createdAwards };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }
}

module.exports = new CheckoutAwardsUseCase();
