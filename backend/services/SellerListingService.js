const { SellerListing, ProductDNA } = require('../sequelize_setup');
const { 
  DuplicateSellerListingError, 
  ListingNotFoundError, 
  ListingOwnershipError, 
  InvalidListingDataError 
} = require('../errors/CatalogErrors');

class SellerListingService {
  /**
   * Validates incoming listing data.
   * Throws InvalidListingDataError if validation fails.
   */
  static validateListingData(data) {
    if (data.price !== undefined && data.price < 0) {
      throw new InvalidListingDataError("Price cannot be negative");
    }
    if (data.stockLevel !== undefined && data.stockLevel < 0) {
      throw new InvalidListingDataError("Stock level cannot be negative");
    }
    if (data.deliveryTime !== undefined && data.deliveryTime < 0) {
      throw new InvalidListingDataError("Delivery time cannot be negative");
    }
    
    // Add any other specific business logic validations here
  }

  /**
   * Filters input data to prevent updating restricted fields like id, dnaId, etc.
   */
  static sanitizeListingData(data) {
    const allowedFields = [
      'sellerSku',
      'price',
      'currencyCode',
      'stockLevel',
      'lowStockThreshold',
      'deliveryTime',
      'origin',
      'autoNegotiationEnabled',
      'minAcceptablePrice',
      'status'
    ];

    const sanitized = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        sanitized[field] = data[field];
      }
    }
    return sanitized;
  }

  /**
   * Create a new seller listing
   */
  static async createListing(dnaId, organizationId, userId, listingData, options = { transaction: null }) {
    try {
      this.validateListingData(listingData);
      const sanitizedData = this.sanitizeListingData(listingData);

      const listing = await SellerListing.create({
        ...sanitizedData,
        dnaId,
        organizationId,
        createdByUserId: userId
      }, { transaction: options.transaction });

      return listing;

    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new DuplicateSellerListingError("Duplicate constraint violated: Either the organization already has a listing for this product or the SKU is duplicated.");
      }
      throw error; // Re-throw other unexpected errors
    }
  }

  /**
   * Update an existing seller listing
   */
  static async updateListing(listingId, organizationId, updateData, options = { transaction: null }) {
    // Ownership Check: 1 query to find by ID and ensure it belongs to the org
    const listing = await SellerListing.findOne({
      where: { id: listingId, organizationId },
      transaction: options.transaction
    });

    if (!listing) {
      // Find if it exists but belongs to someone else to throw a specific error, 
      // or if it was just not found/archived
      const existsButOtherOrg = await SellerListing.findByPk(listingId, { transaction: options.transaction });
      if (existsButOtherOrg && existsButOtherOrg.organizationId !== organizationId) {
        throw new ListingOwnershipError("You do not have permission to modify this listing");
      }
      throw new ListingNotFoundError("Seller listing not found or is archived");
    }

    this.validateListingData(updateData);
    const sanitizedData = this.sanitizeListingData(updateData);

    // Update the object and save
    Object.assign(listing, sanitizedData);
    await listing.save({ transaction: options.transaction });

    return listing;
  }

  /**
   * Archive (Soft Delete) a seller listing
   */
  static async archiveListing(listingId, organizationId, options = { transaction: null }) {
    const listing = await SellerListing.findOne({
      where: { id: listingId, organizationId },
      transaction: options.transaction
    });

    if (!listing) {
      throw new ListingNotFoundError("Seller listing not found");
    }

    // 1. Change status to archived and save
    listing.status = 'archived';
    await listing.save({ transaction: options.transaction });

    // 2. Soft delete it
    await listing.destroy({ transaction: options.transaction });

    return listing;
  }
}

module.exports = SellerListingService;
