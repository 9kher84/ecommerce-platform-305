class LegacyProductAdapter {
  /**
   * Transforms a new Catalog DTO into a Legacy Product DTO
   * strictly adhering to the old schema shape.
   * Pure function: no ORM, no logic.
   */
  static toLegacyProduct(catalogDto) {
    if (!catalogDto || !catalogDto.product || !catalogDto.bestActiveListing) {
      return null;
    }

    return {
      ...this._mapIdentity(catalogDto),
      ...this._mapPricing(catalogDto),
      ...this._mapInventory(catalogDto),
      ...this._mapSpecifications(catalogDto),
      ...this._mapMetadata(catalogDto)
    };
  }

  static _mapIdentity(dto) {
    const { product, bestActiveListing } = dto;
    
    // Convert normalizedName into legacy I18n JSON format if expected
    const legacyName = {
      en: product.normalizedName || "",
      ar: product.normalizedName || "" // Placeholder if no Arabic exists
    };

    const legacyDescription = {
      en: product.description || "",
      ar: product.description || ""
    };

    return {
      id: bestActiveListing.id, // Legacy products tracked listings directly
      name: legacyName,
      description: legacyDescription,
      categoryId: product.categoryId,
      assetTypeId: product.categoryId, // Fallback since assetType is being deprecated
      ownerOrganizationId: bestActiveListing.organization?.id,
      sellerId: bestActiveListing.createdByUserId // if available in DTO
    };
  }

  static _mapPricing(dto) {
    const { bestActiveListing } = dto;
    return {
      estimatedPrice: bestActiveListing.price,
      purchasePrice: null, // Legacy encrypted string (irrelevant here)
      currencyCode: bestActiveListing.currencyCode,
      autoNegotiationEnabled: bestActiveListing.autoNegotiationEnabled || false,
      minAcceptablePrice: bestActiveListing.minAcceptablePrice || bestActiveListing.price,
      negotiationStrategy: null
    };
  }

  static _mapInventory(dto) {
    const { bestActiveListing } = dto;
    return {
      stockLevel: bestActiveListing.stockLevel,
      lowStockThreshold: bestActiveListing.lowStockThreshold || 10,
      deliveryTime: bestActiveListing.deliveryTime || null,
      storageCost: 0.0, // Default legacy
      status: bestActiveListing.status || 'active'
    };
  }

  static _mapSpecifications(dto) {
    const { attributes } = dto;
    const specs = {};
    let unit = "Piece"; // Default legacy unit
    let origin = null;

    if (Array.isArray(attributes)) {
      for (const attr of attributes) {
        specs[attr.key] = attr.value;
        // If unit or origin are provided in dynamic EAV, we can extract them
        if (attr.key.toLowerCase() === 'unit') unit = attr.value;
        if (attr.key.toLowerCase() === 'origin') origin = attr.value;
      }
    }

    return {
      specs,       // Flattened JSON object
      unit,
      origin,
      productTier: "basic" // Default legacy tier
    };
  }

  static _mapMetadata(dto) {
    return {
      image: null,
      productionDate: null,
      ai_proposals: null
    };
  }
}

module.exports = LegacyProductAdapter;
