const { PurchaseOrder, WorkPackage, CommercialProcess, PurchaseRequest, Invoice, sequelize } = require("../sequelize_setup");
const AppError = require("../utils/appError");

class CompletionService {
  /**
   * Finalizes the full commercial process aggregate upon payment completion.
   * Transactional and idempotent. Enforces preconditions: PO must be paid & Invoice paid.
   */
  static async finalizeCommercialProcess(poId, options = {}) {
    const transaction = options.transaction || await sequelize.transaction();
    const isLocalTx = !options.transaction;

    try {
      const po = await PurchaseOrder.findByPk(poId, { transaction });
      if (!po) throw new AppError(`Purchase Order ${poId} not found for completion`, 404);

      // Idempotency: Return immediately if already closed
      if (po.businessStatus === "closed") {
        if (isLocalTx) await transaction.commit();
        return po;
      }

      if (po.businessStatus !== "paid" && po.businessStatus !== "accepted") {
        throw new AppError(`Cannot complete commercial process: Purchase Order is in '${po.businessStatus}' state. Must be paid.`, 400);
      }

      // Check associated Invoice status if exists
      const invoice = await Invoice.findOne({ where: { purchaseOrderId: poId }, transaction });
      if (invoice && invoice.status !== "paid") {
        throw new AppError(`Cannot complete commercial process: B2B Invoice ${invoice.id} is in '${invoice.status}' state. Must be paid.`, 400);
      }

      // Transition PurchaseOrder to closed
      await po.update({ businessStatus: "closed", fulfillmentStatus: "received" }, { transaction });

      // Transition parent WorkPackage & CommercialProcess if present
      if (po.awardId) {
        const { Award } = require("../sequelize_setup");
        const award = await Award.findByPk(po.awardId, { transaction });
        if (award && award.commercialProcessId) {
          await CommercialProcess.update(
            { status: "closed" },
            { where: { id: award.commercialProcessId }, transaction }
          );

          const commProcess = await CommercialProcess.findByPk(award.commercialProcessId, { transaction });
          if (commProcess && commProcess.workPackageId) {
            await WorkPackage.update(
              { status: "closed" },
              { where: { id: commProcess.workPackageId }, transaction }
            );

            const wp = await WorkPackage.findByPk(commProcess.workPackageId, { transaction });
            if (wp && wp.purchaseRequestId) {
              await PurchaseRequest.update(
                { status: "completed" },
                { where: { id: wp.purchaseRequestId }, transaction }
              );
            }
          }
        }
      }

      if (isLocalTx) await transaction.commit();
      return po;
    } catch (err) {
      if (isLocalTx) await transaction.rollback();
      throw err;
    }
  }
}

module.exports = CompletionService;
