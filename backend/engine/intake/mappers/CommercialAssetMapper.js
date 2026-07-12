/**
 * Pure Translator Layer.
 * Responsibilities:
 * - Convert CommercialOpportunityDTO to specific persistence payloads (Product, PurchaseRequest).
 * - No database access.
 * - No business logic.
 * - No Sequelize instances.
 */
class CommercialAssetMapper {
  /**
   * @param {import('../domain/CommercialOpportunityDTO')} dto 
   * @param {Object} validationMetadata - Metadata passed from ValidationResult (e.g. suggestedPrice)
   * @param {Object} context - User context (userId, organizationId)
   * @returns {Object} { entityType: "Product" | "PurchaseRequest", payload: Object }
   */
  static mapToPayload(dto, validationMetadata = {}, context = {}) {
    if (!dto) {
      throw new Error("Cannot map undefined DTO");
    }

    if (dto.type === "SUPPLY") {
      return {
        entityType: "Product",
        payload: {
          name: { ar: dto.name, en: dto.name },
          description: { ar: "", en: "" },
          quantity: dto.quantity || 0,
          stockLevel: dto.quantity || 0,
          unit: dto.unit || "piece",
          estimatedPrice: dto.price || validationMetadata.suggestedPrice || null,
          assetTypeId: dto.assetTypeId || null,
          sellerId: context.userId || null,
          ownerOrganizationId: context.organizationId || null,
          categoryId: context.categoryId || null, // Might be resolved later or provided in context
          // Defaulting to basic tier as per DB defaults, but not inserting business logic here, just filling payload shape
          productTier: "basic"
        }
      };
    }

    if (dto.type === "DEMAND") {
      return {
        entityType: "PurchaseRequest",
        payload: {
          title: dto.name,
          description: "",
          quantity: dto.quantity || 0,
          unit: dto.unit || "piece",
          price_range_max: dto.price || validationMetadata.suggestedPrice || null,
          assetTypeId: dto.assetTypeId || null,
          userId: context.userId || null,
          organization_id: context.organizationId || null,
          sectorId: context.categoryId || null, // Assuming required
          status: "draft"
        }
      };
    }

    throw new Error(`Unsupported opportunity type: ${dto.type}`);
  }
}

module.exports = CommercialAssetMapper;
