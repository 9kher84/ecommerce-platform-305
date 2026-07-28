const SubmitInitialProposalUseCase = require('../../application/use-cases/SubmitInitialProposalUseCase');
const SubmitRevisionUseCase = require('../../application/use-cases/SubmitRevisionUseCase');
const AcceptNegotiationRevisionUseCase = require('../../application/use-cases/AcceptNegotiationRevisionUseCase');
const RejectNegotiationRevisionUseCase = require('../../application/use-cases/RejectNegotiationRevisionUseCase');
const { CommercialProcess, NegotiationSheet, ProcessParty } = require('../../../../../sequelize_setup');

class NegotiationController {
  
  async submitInitialProposal(req, res) {
    try {
      const { workPackageId } = req.params;
      const { terms, notes, validUntil } = req.body;
      const sellerUserId = req.user.id;
      // In a real scenario, organization_id is retrieved from user context
      const sellerOrganizationId = req.user.organization_id || null;

      const result = await SubmitInitialProposalUseCase.execute({
        workPackageId,
        sellerUserId,
        sellerOrganizationId,
        terms,
        notes,
        validUntil
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async submitRevision(req, res) {
    try {
      const { id: commercialProcessId } = req.params;
      const { decision, terms, notes, validUntil } = req.body;
      const initiatorUserId = req.user.id;

      const result = await SubmitRevisionUseCase.execute({
        commercialProcessId,
        initiatorUserId,
        decision,
        terms,
        notes,
        validUntil
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async acceptRevision(req, res) {
    try {
      const { id: commercialProcessId } = req.params;
      const userId = req.user.id;

      const result = await AcceptNegotiationRevisionUseCase.execute({ commercialProcessId, userId });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async rejectRevision(req, res) {
    try {
      const { id: commercialProcessId } = req.params;
      const userId = req.user.id;

      const result = await RejectNegotiationRevisionUseCase.execute({ commercialProcessId, userId });
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getTimeline(req, res) {
    try {
      const { id: commercialProcessId } = req.params;

      const process = await CommercialProcess.findByPk(commercialProcessId, {
        include: [
          { model: ProcessParty, as: 'parties' },
          { model: NegotiationSheet, as: 'negotiationSheets' }
        ],
        order: [[{ model: NegotiationSheet, as: 'negotiationSheets' }, 'version', 'ASC']]
      });

      if (!process) {
        return res.status(404).json({ success: false, error: 'Commercial Process not found' });
      }

      res.status(200).json({ success: true, data: process });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getMatrix(req, res) {
    try {
      const { id: workPackageId } = req.params;
      
      const processes = await CommercialProcess.findAll({
        where: { workPackageId, processType: 'NEGOTIATION' },
        include: [
          { model: ProcessParty, as: 'parties' },
          { 
            model: NegotiationSheet, 
            as: 'negotiationSheets',
            where: { status: 'PENDING' },
            required: false // We still want processes that might not have a pending sheet
          }
        ]
      });
      
      res.status(200).json({ success: true, data: processes });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async getInbox(req, res) {
    try {
      const userId = req.user.id;
      // In a real implementation, this would aggregate from multiple domains (collaboration, negotiations, etc)
      // For Wave 2.5 MVP, we'll fetch processes that are 'pending_award'
      
      const pendingAwards = await CommercialProcess.findAll({
        where: { status: 'pending_award' },
        include: [
          { model: ProcessParty, as: 'parties', where: { userId, partyRole: 'BUYER' } },
          { 
            model: require('../../../../../sequelize_setup').WorkPackage, 
            as: 'workPackage',
            attributes: ['id', 'name', 'purchaseRequestId']
          }
        ]
      });

      res.status(200).json({ 
        success: true, 
        data: {
          pendingAwards
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async checkoutAwards(req, res) {
    try {
      const { processIds } = req.body;
      const userId = req.user.id;
      const CheckoutAwardsUseCase = require('../../application/use-cases/CheckoutAwardsUseCase');

      const result = await CheckoutAwardsUseCase.execute({
        commercialProcessIds: processIds,
        userId
      });

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}

module.exports = new NegotiationController();
