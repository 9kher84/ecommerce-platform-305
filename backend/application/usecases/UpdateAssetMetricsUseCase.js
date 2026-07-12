class UpdateAssetMetricsUseCase {
  constructor(productRepository, purchaseRequestRepository) {
    this.productRepository = productRepository;
    this.purchaseRequestRepository = purchaseRequestRepository;
  }

  async execute(type, id, updates, context) {
    const options = context && context.transaction ? { transaction: context.transaction } : {};
    
    if (type === "SUPPLY") {
      return await this.productRepository.update(id, updates, options);
    } else if (type === "DEMAND") {
      return await this.purchaseRequestRepository.update(id, updates, options);
    }
    
    throw new Error(`Unknown type ${type} for update`);
  }
}

module.exports = UpdateAssetMetricsUseCase;
