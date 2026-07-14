const { Op } = require("sequelize");
const { SellerListing, AttributeSchema, ProductDNAAttribute, Organization } = require("../sequelize_setup");

class CatalogQueryBuilder {
  constructor() {
    this.where = {};
    this.include = [];
    this.order = [];
  }

  /**
   * 1. Build WHERE (Static attributes like Category, Brand, etc.)
   */
  buildWhere(filters = {}) {
    if (filters.categoryId) {
      this.where.categoryId = filters.categoryId;
    }
    if (filters.brandId) {
      this.where.brandId = filters.brandId;
    }
    // Only fetch non-deleted DNAs implicitly via paranoid: true (handled by Sequelize)
    return this;
  }

  /**
   * Filter DNA IDs explicitly (used for EAV intersections)
   */
  addDnaIdFilter(dnaIds) {
    this.where.id = {
      [Op.in]: dnaIds
    };
    return this;
  }

  /**
   * 2. Build INCLUDE (SellerListings and Attributes)
   */
  buildInclude(filters = {}) {
    // A. Include SellerListings
    const listingWhere = { status: 'active' }; // Only active listings

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      listingWhere.price = {};
      if (filters.minPrice !== undefined) listingWhere.price[Op.gte] = filters.minPrice;
      if (filters.maxPrice !== undefined) listingWhere.price[Op.lte] = filters.maxPrice;
    }

    if (filters.sellerId) {
      listingWhere.createdByUserId = filters.sellerId;
    }

    if (filters.status) {
      listingWhere.status = filters.status;
    }

    this.include.push({
      model: SellerListing,
      as: 'sellerListings',
      where: listingWhere,
      required: true, // Only return ProductDNA if it has at least one matching active listing!
      include: [
        { model: Organization, as: 'organization', attributes: ['id', 'name'] } // Include Org for DTO
      ]
    });

    // B. Include Attributes for the DTO
    this.include.push({
      model: AttributeSchema,
      as: 'attributes',
      through: { attributes: ['valueString', 'valueNumber', 'valueBoolean', 'valueDate'] }
    });

    return this;
  }

  /**
   * 3. Build ORDER
   * Rule: Catalog ALWAYS sorts by Lowest Active Listing Price when price sort is requested,
   * or as a default tie-breaker.
   */
  buildOrder(sortField, sortDirection) {
    const dir = sortDirection?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    if (sortField === 'price') {
      // Sort by the included SellerListing's price
      this.order.push([{ model: SellerListing, as: 'sellerListings' }, 'price', dir]);
    } else if (sortField === 'createdAt') {
      this.order.push(['createdAt', dir]);
      // Tie breaker by price
      this.order.push([{ model: SellerListing, as: 'sellerListings' }, 'price', 'ASC']);
    } else {
      // Default sort
      this.order.push([{ model: SellerListing, as: 'sellerListings' }, 'price', 'ASC']);
    }

    return this;
  }

  build() {
    return {
      where: this.where,
      include: this.include,
      order: this.order
    };
  }
}

module.exports = CatalogQueryBuilder;
