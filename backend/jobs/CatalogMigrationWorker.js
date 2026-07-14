const { sequelize, Product, ProductDNA, SellerListing, AttributeSchema, ProductDNAAttribute, Organization } = require("../sequelize_setup");

class CatalogMigrationWorker {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.resumeFromId = options.resumeFromId || null;
    this.stats = {
      totalProductsRead: 0,
      totalProductsMigrated: 0,
      totalSkipped: 0,
      totalFailures: 0,
      totalDNACreated: 0,
      totalDNAReused: 0,
      duplicateGroups: [], // Track fingerprints to see collisions
      failedMigrations: []
    };
    
    // Internal cache to simulate "reused" across multiple runs in same process
    this.dnaFingerprintCache = new Map();
  }

  async execute() {
    const startTime = Date.now();
    console.log(`🚀 Starting Migration Worker (Dry Run: ${this.dryRun})`);

    const whereClause = {};
    if (this.resumeFromId) {
      // Simplistic resume based on createdAt or ID. Let's just grab everything and skip by `SellerListing` existence.
      // A true resume by ID requires ordered fetching. We'll rely on idempotency for true resume.
    }

    const products = await Product.findAll({
      order: [['createdAt', 'ASC']],
      where: whereClause
    });

    for (const product of products) {
      this.stats.totalProductsRead++;
      
      // Independent Transaction for Resilience
      const transaction = await sequelize.transaction();
      
      try {
        await this._processProduct(product, transaction);
        if (!this.dryRun) {
          await transaction.commit();
        } else {
          await transaction.rollback(); // Rollback dry run
          this.dnaFingerprintCache.clear(); // Clear so rolled-back IDs aren't reused
        }
        this.stats.totalProductsMigrated++;
      } catch (error) {
        await transaction.rollback();
        if (error.message === 'SKIPPED') {
          this.stats.totalSkipped++;
        } else {
          this.stats.totalFailures++;
          this.stats.failedMigrations.push({ productId: product.id, error: error.message });
          console.warn(`⚠️ Failed Product ${product.id}: ${error.message}`);
          if (error.errors) console.warn(error.errors.map(e => e.message));
        }
      }
    }

    const endTime = Date.now();
    this.stats.executionTime = `${(endTime - startTime) / 1000}s`;
    this.stats.averageTimePerProduct = `${((endTime - startTime) / Math.max(1, this.stats.totalProductsRead)).toFixed(2)}ms`;

    return this.stats;
  }

  async _processProduct(product, transaction) {
    const sellerSku = `LEGACY-MIGRATION-${product.id}`;

    // 1. Check Idempotency
    const existingListing = await SellerListing.findOne({
      where: { legacyProductId: product.id },
      transaction
    });

    if (existingListing) {
      throw new Error('SKIPPED'); // Will be caught and tallied as skipped
    }

    // 2. Organization Check
    if (!product.ownerOrganizationId) {
       throw new Error('Missing ownerOrganizationId');
    }
    const orgExists = await Organization.findByPk(product.ownerOrganizationId, { transaction });
    if (!orgExists) {
      throw new Error(`Organization ${product.ownerOrganizationId} not found`);
    }

    // 3. Deduplication Fingerprint & Canonical Builder
    const fingerprint = this._generateFingerprint(product);
    let dnaId = null;

    if (this.dnaFingerprintCache.has(fingerprint)) {
      dnaId = this.dnaFingerprintCache.get(fingerprint);
      this.stats.totalDNAReused++;
      this._recordCollision(fingerprint, product.id);
    } else {
      // Build Canonical DNA
      const newDNA = await ProductDNA.create({
        normalizedName: this._getNormalizedName(product),
        description: typeof product.description === 'string' ? product.description : JSON.stringify(product.description),
        categoryId: product.categoryId,
        baseImage: product.image
      }, { transaction });
      
      dnaId = newDNA.id;
      this.dnaFingerprintCache.set(fingerprint, dnaId);
      this.stats.totalDNACreated++;
      this._recordCollision(fingerprint, product.id);
    }

    // 4. Create Seller Listing
    await SellerListing.create({
      dnaId: dnaId,
      organizationId: product.ownerOrganizationId,
      createdByUserId: product.sellerId || product.ownerOrganizationId, // Fallback if sellerId is missing
      sellerSku: sellerSku,
      legacyProductId: product.id,
      migrationVersion: 1,
      price: product.estimatedPrice || 0,
      stockLevel: product.stockLevel || 0,
      deliveryTime: product.deliveryTime,
      lowStockThreshold: product.lowStockThreshold || 10,
      status: 'active', // Default legacy products to active
      currencyCode: 'SAR',
      origin: product.origin,
      autoNegotiationEnabled: product.autoNegotiationEnabled || false,
      minAcceptablePrice: product.minAcceptablePrice || product.estimatedPrice || 0
    }, { transaction });

    // 5. Extract and Create Attributes (EAV)
    await this._extractAndCreateAttributes(product, dnaId, transaction);
  }

  _generateFingerprint(product) {
    const normalizedName = this._getNormalizedName(product);
    let keySpecsStr = "";
    
    try {
      if (product.specs) {
        const parsed = JSON.parse(product.specs);
        const keys = ['material', 'size', 'model', 'capacity', 'weight', 'diameter'];
        const vals = keys.map(k => parsed[k]).filter(Boolean);
        if (vals.length > 0) keySpecsStr = vals.join('|').toLowerCase();
      }
    } catch(e) {}

    return `${normalizedName}::${product.categoryId}::${keySpecsStr}`;
  }

  _getNormalizedName(product) {
    const nameStr = typeof product.name === 'string' ? product.name : (product.name?.en || product.name?.ar || 'Unknown Product');
    return nameStr.toLowerCase().trim().replace(/\s+/g, ' ');
  }

  _recordCollision(fingerprint, productId) {
    let group = this.stats.duplicateGroups.find(g => g.dnaFingerprint === fingerprint);
    if (!group) {
      group = { dnaFingerprint: fingerprint, legacyProducts: [] };
      this.stats.duplicateGroups.push(group);
    }
    group.legacyProducts.push(productId);
  }

  async _extractAndCreateAttributes(product, dnaId, transaction) {
    // Basic dynamic attributes we might encounter
    const dynamicAttrs = {};
    if (product.unit) dynamicAttrs['unit'] = product.unit;
    
    try {
      if (product.specs) {
        const parsed = JSON.parse(product.specs);
        for (const [k, v] of Object.entries(parsed)) {
          dynamicAttrs[k] = v;
        }
      }
    } catch (e) {}

    for (const [key, value] of Object.entries(dynamicAttrs)) {
      if (!value) continue;
      
      const [schema] = await AttributeSchema.findOrCreate({
        where: { key },
        defaults: { dataType: typeof value === 'number' ? 'number' : 'string' },
        transaction
      });

      const valCol = schema.dataType === 'number' ? 'valueNumber' : 'valueString';
      
      // Use findOrCreate to avoid duplicate attributes if DNA was reused
      await ProductDNAAttribute.findOrCreate({
        where: { dnaId, attributeId: schema.id },
        defaults: { [valCol]: value },
        transaction
      });
    }
  }
}

// CLI Execution Support
if (require.main === module) {
  const isDryRun = process.argv.includes('--dry-run');
  const worker = new CatalogMigrationWorker({ dryRun: isDryRun });
  worker.execute().then(stats => {
    console.log("\n=== MIGRATION REPORT ===");
    console.log(JSON.stringify(stats, null, 2));
    process.exit(0);
  });
}

module.exports = CatalogMigrationWorker;
