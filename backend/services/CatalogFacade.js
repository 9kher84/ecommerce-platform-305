const CatalogQueryService = require("./CatalogQueryService");
const LegacyProductAdapter = require("../adapters/LegacyProductAdapter");

class CatalogFacade {
  /**
   * Translates generic filters into a Legacy-compatible response 
   * using the New Catalog Architecture (Shadow Migration).
   */
  static async getProducts(filters = {}, pagination = {}, sort = {}) {
    // 1. Fetch from New Architecture
    const catalogResult = await CatalogQueryService.searchCatalog({
      filters,
      pagination,
      sort
    });

    // 2. Map DTOs to Legacy Format
    const legacyProducts = catalogResult.data
      .map(dto => LegacyProductAdapter.toLegacyProduct(dto))
      .filter(Boolean); // Remove nulls if any

    // 3. Match EXACT Legacy Response Contract
    return {
      success: true,
      count: legacyProducts.length,
      products: legacyProducts
    };
  }
}

module.exports = CatalogFacade;
