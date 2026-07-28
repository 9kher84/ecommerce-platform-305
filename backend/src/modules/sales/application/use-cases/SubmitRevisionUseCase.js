const { CommercialProcess, ProcessParty, NegotiationSheet, sequelize } = require('../../../../../sequelize_setup');
const { v4: uuidv4 } = require('uuid');

function computeChangeSet(oldTerms, newTerms) {
  const changeSet = {};
  const allKeys = new Set([...Object.keys(oldTerms || {}), ...Object.keys(newTerms || {})]);

  for (const key of allKeys) {
    const oldVal = oldTerms[key];
    const newVal = newTerms[key];

    // Simple diff comparison
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changeSet[key] = {
        from: oldVal,
        to: newVal
      };
    }
  }
  return changeSet;
}

class SubmitRevisionUseCase {
  async execute({ commercialProcessId, initiatorUserId, decision, terms, notes, validUntil }) {
    const transaction = await sequelize.transaction();

    try {
      const process = await CommercialProcess.findByPk(commercialProcessId, {
        include: [{ model: ProcessParty, as: 'parties' }],
        transaction
      });

      if (!process) throw new Error('CommercialProcess not found');
      if (['agreed', 'awarded', 'cancelled', 'expired', 'closed'].includes(process.status)) {
        throw new Error(`Cannot submit revision. Process is already ${process.status}`);
      }

      // Identify Initiator Party
      const initiatorParty = process.parties.find(p => p.userId === initiatorUserId);
      if (!initiatorParty) {
        throw new Error('User is not a party in this commercial process');
      }

      // Prevent consecutive turns from the same party unless it's a REQUEST_CHANGE or INFORMATION
      // Wait, let's keep it simple: just allow the revision, maybe they wanted to amend their own offer.

      // Find the latest active sheet
      const activeSheet = await NegotiationSheet.findOne({
        where: { commercialProcessId, status: 'PENDING' },
        order: [['version', 'DESC']],
        transaction
      });

      if (!activeSheet) {
        throw new Error('No active PENDING sheet found to revise');
      }

      // Supersede the old sheet
      activeSheet.status = 'SUPERSEDED';
      await activeSheet.save({ transaction });

      // Compute ChangeSet
      const changeSet = computeChangeSet(activeSheet.terms, terms);

      // Create new Revision
      const newSheet = await NegotiationSheet.create({
        id: uuidv4(),
        commercialProcessId,
        initiatorPartyId: initiatorParty.id,
        version: activeSheet.version + 1,
        decision, // COUNTER, REQUEST_CHANGE, INFORMATION
        terms: terms || {},
        changeSet: Object.keys(changeSet).length > 0 ? changeSet : null,
        notes: notes ? notes.substring(0, 300) : null,
        validUntil: validUntil || null,
        status: 'PENDING'
      }, { transaction });

      // Update Process Status based on Initiator Role
      if (initiatorParty.partyRole === 'SELLER') {
        process.status = 'waiting_buyer';
      } else if (initiatorParty.partyRole === 'BUYER') {
        process.status = 'waiting_seller';
      }
      await process.save({ transaction });

      await transaction.commit();

      return { process, newSheet };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new SubmitRevisionUseCase();
