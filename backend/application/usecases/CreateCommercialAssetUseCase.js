const CommercialAssetMapper = require("../../engine/intake/mappers/CommercialAssetMapper");

class CreateCommercialAssetUseCase {
  /**
   * @param {import('../interfaces/IProductRepository')} productRepository 
   */
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  /**
   * @param {import('../../engine/intake/domain/CommercialOpportunityDTO')} dto 
   * @param {Object} validationMetadata 
   * @param {Object} context 
   */
  async execute(dto, validationMetadata, context) {
    if (dto.type !== "SUPPLY") {
      throw new Error("Invalid DTO type for this Use Case");
    }

    // 1. Map to payload
    const mappedResult = CommercialAssetMapper.mapToPayload(dto, validationMetadata, context);
    
    // 2. Persist
    const product = await this.productRepository.create(mappedResult.payload, {
      transaction: context.transaction
    });
    
    return product;
  }
}

module.exports = CreateCommercialAssetUseCase;
