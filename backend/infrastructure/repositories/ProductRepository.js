const IProductRepository = require("../../application/interfaces/IProductRepository");

class ProductRepository extends IProductRepository {
  /**
   * @param {Object} ProductModel - Sequelize model
   */
  constructor(ProductModel) {
    super();
    this.Product = ProductModel;
  }

  async create(payload, options = {}) {
    return await this.Product.create(payload, options);
  }

  async update(id, payload, options = {}) {
    await this.Product.update(payload, {
      where: { id },
      ...options
    });
    // For consistency with Create, return the updated object (or just ID)
    // The orchestrator just needs it to be saved.
    return { id, ...payload };
  }
}

module.exports = ProductRepository;
