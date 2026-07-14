const { sequelize, ProductDNA, Organization, User, SellerListing, Category } = require("./sequelize_setup");

async function verifyCatalogSplit() {
  console.log("=== SELLER LISTINGS VERIFICATION ===");

  try {
    // 1. Setup Base Data
    const [category] = await Category.findOrCreate({
      where: { name_en: 'Building Materials' },
      defaults: { name_ar: 'مواد البناء', isActive: true }
    });

    const [productDna] = await ProductDNA.findOrCreate({
      where: { normalizedName: 'Steel Rebar 12mm' },
      defaults: { categoryId: category.id, description: 'Standard 12mm steel rebar' }
    });

    // 2. Create Orgs & Users
    const [orgA] = await Organization.findOrCreate({
      where: { name: 'Seller Org A' },
      defaults: { commercial_registration: '1234567890' }
    });
    
    const [orgB] = await Organization.findOrCreate({
      where: { name: 'Seller Org B' },
      defaults: { commercial_registration: '0987654321' }
    });

    const [userA] = await User.findOrCreate({
      where: { email: 'usera@example.com' },
      defaults: { name: 'User A', password: 'password123', role: 'seller' }
    });

    const [userB] = await User.findOrCreate({
      where: { email: 'userb@example.com' },
      defaults: { name: 'User B', password: 'password123', role: 'seller' }
    });

    // 3. Create Seller Listings
    console.log("Creating Seller Listing for Org A...");
    await SellerListing.findOrCreate({
      where: { dnaId: productDna.id, organizationId: orgA.id },
      defaults: {
        createdByUserId: userA.id,
        sellerSku: 'REB-A-12',
        price: 50.00,
        currencyCode: 'SAR',
        stockLevel: 100,
        status: 'active'
      }
    });

    console.log("Creating Seller Listing for Org B...");
    await SellerListing.findOrCreate({
      where: { dnaId: productDna.id, organizationId: orgB.id },
      defaults: {
        createdByUserId: userB.id,
        sellerSku: 'STL-12-B',
        price: 48.00,
        currencyCode: 'SAR',
        stockLevel: 500,
        status: 'active'
      }
    });

    // 4. Test Constraints
    console.log("Testing Unique Constraint (dnaId, organizationId)...");
    let duplicateCaught = false;
    try {
      await SellerListing.create({
        dnaId: productDna.id,
        organizationId: orgA.id,
        createdByUserId: userA.id,
        sellerSku: 'REB-A-DUP',
        price: 45.00
      });
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        duplicateCaught = true;
      } else {
        throw e;
      }
    }
    
    console.log(`- Prevent Duplicate Listing from Same Org? ${duplicateCaught}`);

    // 5. Verify 1-to-Many Association
    console.log("\nVerifying ProductDNA -> SellerListings relation...");
    const fetchedDna = await ProductDNA.findByPk(productDna.id, {
      include: [
        {
          model: SellerListing,
          as: "sellerListings",
          include: [
            { model: Organization, as: "organization", attributes: ['name'] }
          ]
        }
      ]
    });

    console.log(`Product: ${fetchedDna.normalizedName}`);
    console.log(`Found ${fetchedDna.sellerListings.length} Active Listings:`);
    
    fetchedDna.sellerListings.forEach(listing => {
      console.log(`- Seller: ${listing.organization.name} | SKU: ${listing.sellerSku} | Price: ${listing.price} ${listing.currencyCode} | Stock: ${listing.stockLevel} | Status: ${listing.status}`);
    });

    if (fetchedDna.sellerListings.length >= 2 && duplicateCaught) {
      console.log("\n✅ Catalog Split & Constraints Verified Successfully!");
    } else {
      console.error("\n❌ Verification Failed!");
    }

    console.log("=== VERIFICATION COMPLETE ===");

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    process.exit(0);
  }
}

verifyCatalogSplit();
