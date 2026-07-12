const IPurchaseRequestRepository = require("../../application/interfaces/IPurchaseRequestRepository");

class PurchaseRequestRepository extends IPurchaseRequestRepository {
  /**
   * @param {Object} PurchaseRequestModel - Sequelize model
   */
  constructor(PurchaseRequestModel) {
    super();
    this.PurchaseRequest = PurchaseRequestModel;
  }

  async create(payload, options = {}) {
    return await this.PurchaseRequest.create(payload, options);
  }

  async update(id, payload, options = {}) {
    await this.PurchaseRequest.update(payload, {
      where: { id },
      ...options
    });
    return { id, ...payload };
  }
}

module.exports = PurchaseRequestRepository;
