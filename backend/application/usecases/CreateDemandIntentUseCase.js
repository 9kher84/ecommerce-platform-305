const CommercialAssetMapper = require("../../engine/intake/mappers/CommercialAssetMapper");

class CreateDemandIntentUseCase {
  /**
   * @param {import('../interfaces/IPurchaseRequestRepository')} purchaseRequestRepository 
   */
  constructor(purchaseRequestRepository) {
    this.purchaseRequestRepository = purchaseRequestRepository;
  }

  /**
   * @param {import('../../engine/intake/domain/CommercialOpportunityDTO')} dto 
   * @param {Object} validationMetadata 
   * @param {Object} context 
   */
  async execute(dto, validationMetadata, context) {
    if (dto.type !== "DEMAND") {
      throw new Error("Invalid DTO type for this Use Case");
    }

    // 1. Map to payload
    const mappedResult = CommercialAssetMapper.mapToPayload(dto, validationMetadata, context);
    
    // 2. Persist
    const pr = await this.purchaseRequestRepository.create(mappedResult.payload, {
      transaction: context.transaction
    });
    
    return pr;
  }
}

module.exports = CreateDemandIntentUseCase;
