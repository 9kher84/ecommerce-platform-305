const { sequelize, Product, ProductDNA, SellerListing } = require("../sequelize_setup");

// In-memory retry queue for legacy sync failures
const legacySyncRetryQueue = [];
let retryInterval = null;

// Start the retry worker
function startRetryWorker() {
  if (retryInterval) return;
  retryInterval = setInterval(async () => {
    if (legacySyncRetryQueue.length === 0) return;
    
    console.log(`[Legacy Sync Retry] Processing ${legacySyncRetryQueue.length} queued items...`);
    const currentQueue = [...legacySyncRetryQueue];
    legacySyncRetryQueue.length = 0; // Clear it, failed ones will be re-added

    for (const item of currentQueue) {
      try {
        await syncToLegacy(item.listing, item.dna, item.operation);
        console.log(`[Legacy Sync Retry] Successfully synced listing ${item.listing.id}`);
      } catch (err) {
        console.error(`[Legacy Sync Retry] Retry failed for listing ${item.listing.id}:`, err.message);
        item.retryCount = (item.retryCount || 0) + 1;
        if (item.retryCount < 5) {
          legacySyncRetryQueue.push(item);
        } else {
          console.error(`[Legacy Sync Retry] Max retries reached for listing ${item.listing.id}. Dropping from queue.`);
        }
      }
    }
  }, 5000); // Check every 5 seconds
}

// Ensure worker is running
startRetryWorker();

/**
 * Syncs data back to the legacy Product table.
 * Throws error if it fails (caught by caller to add to retry queue).
 */
async function syncToLegacy(listing, dna, operation) {
  if (operation === 'CREATE') {
    await Product.create({
      id: listing.legacyProductId,
      sellerId: listing.createdByUserId,
      name: dna.normalizedName,
      description: dna.description,
      estimatedPrice: listing.price,
      stockLevel: listing.stockLevel,
      categoryId: dna.categoryId,
      brand: dna.brand,
      unit: "piece", // Legacy requirement
      status: listing.status === 'archived' ? 'archived' : 'active',
      image: dna.imageUrls && dna.imageUrls.length > 0 ? dna.imageUrls[0] : null
    });
  } else if (operation === 'UPDATE' || operation === 'DELETE') {
    const legacyProduct = await Product.findByPk(listing.legacyProductId);
    if (legacyProduct) {
      await legacyProduct.update({
        name: dna.normalizedName,
        description: dna.description,
        estimatedPrice: listing.price,
        stockLevel: listing.stockLevel,
        status: listing.status === 'archived' ? 'archived' : 'active'
      });
    }
  }
}

/**
 * Handle sync failure by adding to retry queue
 */
function handleSyncFailure(listing, dna, operation, error) {
  console.error(`[CatalogWriteFacade] Legacy sync failed for operation ${operation}. Adding to retry queue. Error:`, error.message);
  legacySyncRetryQueue.push({ listing, dna, operation, retryCount: 0 });
}

class CatalogWriteFacade {
  
  static async addProduct(data, sellerId) {
    // Get organizationId
    const { User } = require("../sequelize_setup");
    const user = await User.findByPk(sellerId);
    const orgId = user ? user.organizationId : null;

    const t = await sequelize.transaction();
    let newListing, newDna;
    
    try {
      // 1. Write to Source of Truth (New Catalog)
      newDna = await ProductDNA.create({
        normalizedName: data.name,
        description: data.description,
        categoryId: data.category || data.categoryId,
        brand: data.brand || 'Generic',
        specs: {},
        imageUrls: data.image ? [data.image] : [],
        isVerified: true
      }, { transaction: t });

      newListing = await SellerListing.create({
        dnaId: newDna.id,
        createdByUserId: sellerId,
        organizationId: orgId || "00000000-0000-0000-0000-000000000000",
        legacyProductId: require("crypto").randomUUID(),
        sellerSku: `SKU-${Date.now()}`,
        price: data.estimatedPrice,
        currencyCode: 'SAR',
        stockLevel: data.stockLevel,
        deliveryTime: data.deliveryTime || 3,
        condition: 'New',
        status: 'active',
        catalogVersion: 1
      }, { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    // 2. Compatibility Sync (Decoupled)
    try {
      await syncToLegacy(newListing, newDna, 'CREATE');
    } catch (err) {
      handleSyncFailure(newListing, newDna, 'CREATE', err);
    }

    return {
      id: newListing.legacyProductId,
      name: newDna.normalizedName,
      estimatedPrice: newListing.price,
      stockLevel: newListing.stockLevel,
      status: newListing.status
    };
  }

  static async updateProduct(legacyProductId, data, sellerId) {
    const listing = await SellerListing.findOne({ where: { legacyProductId, createdByUserId: sellerId } });
    if (!listing) throw new Error("Product not found in New Catalog");

    const t = await sequelize.transaction();
    let updatedDna;
    
    try {
      // 1. Write to Source of Truth (New Catalog)
      const dna = await ProductDNA.findByPk(listing.dnaId);
      
      updatedDna = await dna.update({
        normalizedName: data.name || dna.normalizedName,
        description: data.description || dna.description
      }, { transaction: t });

      await listing.update({
        price: data.estimatedPrice !== undefined ? data.estimatedPrice : listing.price,
        stockLevel: data.stockLevel !== undefined ? data.stockLevel : listing.stockLevel,
        catalogVersion: listing.catalogVersion + 1
      }, { transaction: t });

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    // 2. Compatibility Sync (Decoupled)
    try {
      await syncToLegacy(listing, updatedDna, 'UPDATE');
    } catch (err) {
      handleSyncFailure(listing, updatedDna, 'UPDATE', err);
    }

    return {
      id: listing.legacyProductId,
      name: updatedDna.normalizedName,
      estimatedPrice: listing.price,
      stockLevel: listing.stockLevel,
      status: listing.status
    };
  }

  static async deleteProduct(legacyProductId, sellerId) {
    const listing = await SellerListing.findOne({ where: { legacyProductId, createdByUserId: sellerId } });
    if (!listing) throw new Error("Product not found in New Catalog");

    const t = await sequelize.transaction();
    let dna;
    
    try {
      // 1. Soft Delete in Source of Truth
      await listing.update({
        status: 'archived',
        catalogVersion: listing.catalogVersion + 1
      }, { transaction: t });
      
      dna = await ProductDNA.findByPk(listing.dnaId);
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    // 2. Compatibility Sync (Decoupled Soft Delete)
    try {
      await syncToLegacy(listing, dna, 'DELETE');
    } catch (err) {
      handleSyncFailure(listing, dna, 'DELETE', err);
    }

    return { success: true, message: "Product archived" };
  }
}

// Export internal functions for testing purposes
CatalogWriteFacade._legacySyncRetryQueue = legacySyncRetryQueue;
CatalogWriteFacade._syncToLegacy = syncToLegacy;

module.exports = CatalogWriteFacade;
