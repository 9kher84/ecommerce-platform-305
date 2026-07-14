const { ProductDNA, AttributeSchema, ProductDNAAttribute } = require("../sequelize_setup");
const CatalogQueryBuilder = require("./CatalogQueryBuilder");

class CatalogQueryService {
  
  /**
   * Main entry point for searching the catalog.
   */
  static async searchCatalog({ filters = {}, sort = {}, pagination = {} }) {
    // 1. Resolve Pagination
    const limit = Math.min(Math.max(parseInt(pagination.limit) || 20, 1), 100);
    const page = Math.max(parseInt(pagination.page) || 1, 1);
    const offset = (page - 1) * limit;

    // 2. Pre-filter Dynamic EAV Attributes (Intersection Strategy)
    const eavDnaIds = await this._getEavMatchingDnaIds(filters.eav);
    
    // If EAV filters were provided but no DNA matched, return empty immediately.
    if (filters.eav && Object.keys(filters.eav).length > 0 && eavDnaIds.length === 0) {
      return this._buildEmptyResponse(limit, page);
    }

    // 3. Build Query via Builder
    const builder = new CatalogQueryBuilder();
    builder.buildWhere(filters);
    
    if (eavDnaIds && eavDnaIds.length > 0) {
      builder.addDnaIdFilter(eavDnaIds);
    }

    builder.buildInclude(filters);
    builder.buildOrder(sort.field, sort.direction);

    const queryOptions = builder.build();

    // 4. Execute Query (FindAndCountAll)
    // Note: Due to complex includes, count might be tricky in Sequelize. We use distinct to count ProductDNAs.
    const { count, rows } = await ProductDNA.findAndCountAll({
      ...queryOptions,
      limit,
      offset,
      distinct: true
    });

    // 5. Transform to DTO
    const items = rows.map(dna => this._formatDto(dna));

    // 6. Build Metadata
    return this._buildPaginatedResponse(items, count, limit, page);
  }

  /**
   * Helper: Find DNA IDs that match ALL provided EAV filters (AND logic)
   */
  static async _getEavMatchingDnaIds(eavFilters) {
    if (!eavFilters || Object.keys(eavFilters).length === 0) return null;
    
    let matchedIds = null;
    
    for (const [key, value] of Object.entries(eavFilters)) {
      const schema = await AttributeSchema.findOne({ where: { key } });
      if (!schema) return []; // Non-existent attribute means 0 matches
      
      const valueCol = schema.dataType === 'number' ? 'valueNumber' : 
                       schema.dataType === 'boolean' ? 'valueBoolean' : 
                       schema.dataType === 'date' ? 'valueDate' : 'valueString';
                       
      const matches = await ProductDNAAttribute.findAll({
        where: {
          attributeId: schema.id,
          [valueCol]: value
        },
        attributes: ['dnaId']
      });
      
      const ids = matches.map(m => m.dnaId);
      
      if (matchedIds === null) {
        matchedIds = ids;
      } else {
        matchedIds = matchedIds.filter(id => ids.includes(id));
      }
      
      // Early exit if intersection is empty
      if (matchedIds.length === 0) return [];
    }
    
    return matchedIds;
  }

  /**
   * Formats the Sequelize instances into a clean decoupled DTO
   */
  static _formatDto(dna) {
    // The query builder sorts sellerListings by price ASC, so the first one is the best
    const bestListing = dna.sellerListings && dna.sellerListings.length > 0 ? dna.sellerListings[0] : null;

    const attributes = (dna.attributes || []).map(attr => {
      const pda = attr.ProductDNAAttribute; // the join table row
      // find which value is set
      let val = null;
      if (pda.valueString !== null) val = pda.valueString;
      else if (pda.valueNumber !== null) val = pda.valueNumber;
      else if (pda.valueBoolean !== null) val = pda.valueBoolean;
      else if (pda.valueDate !== null) val = pda.valueDate;

      return {
        key: attr.key,
        dataType: attr.dataType,
        unit: attr.unit,
        value: val
      };
    });

    return {
      product: {
        id: dna.id,
        normalizedName: dna.normalizedName,
        description: dna.description,
        categoryId: dna.categoryId,
        brandId: dna.brandId,
        complianceStatus: dna.complianceStatus
      },
      bestActiveListing: bestListing ? {
        id: bestListing.id,
        price: bestListing.price,
        currencyCode: bestListing.currencyCode,
        stockLevel: bestListing.stockLevel,
        deliveryTime: bestListing.deliveryTime,
        sellerSku: bestListing.sellerSku,
        organization: {
          id: bestListing.organization.id,
          name: bestListing.organization.name
        }
      } : null,
      attributes
    };
  }

  static _buildPaginatedResponse(items, totalItems, limit, page) {
    const totalPages = Math.ceil(totalItems / limit);
    return {
      data: items,
      metadata: {
        totalItems,
        totalPages,
        currentPage: page,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };
  }

  static _buildEmptyResponse(limit, page) {
    return this._buildPaginatedResponse([], 0, limit, page);
  }
}

module.exports = CatalogQueryService;
