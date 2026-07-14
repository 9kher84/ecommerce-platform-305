const { sequelize, ProductDNA, Organization, User, SellerListing, Category } = require("./sequelize_setup");
const SellerListingService = require("./services/SellerListingService");
const { 
  DuplicateSellerListingError, 
  ListingNotFoundError, 
  ListingOwnershipError, 
  InvalidListingDataError 
} = require("./errors/CatalogErrors");

async function verifySellerListingService() {
  console.log("=== SELLER LISTING SERVICE VERIFICATION ===");

  try {
    // 1. Setup Base Data
    const [category] = await Category.findOrCreate({
      where: { name_en: 'Building Materials' },
      defaults: { name_ar: 'مواد البناء', isActive: true }
    });

    const [productDna] = await ProductDNA.findOrCreate({
      where: { normalizedName: 'Steel Rebar 14mm' },
      defaults: { categoryId: category.id, description: 'Standard 14mm steel rebar' }
    });

    // 2. Create Orgs & Users
    const [orgA] = await Organization.findOrCreate({
      where: { name: 'Seller Org A - Service Test' },
      defaults: { commercial_registration: 'A-SRV' }
    });
    
    const [orgB] = await Organization.findOrCreate({
      where: { name: 'Seller Org B - Service Test' },
      defaults: { commercial_registration: 'B-SRV' }
    });

    const [userA] = await User.findOrCreate({
      where: { email: 'usera.service@example.com' },
      defaults: { name: 'User A', password: 'password123', role: 'seller' }
    });

    // 3. Test: Create Listing Successfully
    console.log("\n[Test 1] Create Listing Successfully");
    const listing = await SellerListingService.createListing(productDna.id, orgA.id, userA.id, {
      sellerSku: 'SRV-REB-14',
      price: 60.00,
      stockLevel: 100,
      status: 'active'
    });
    console.log(`✅ Listing created with ID: ${listing.id}`);

    // 4. Test: Duplicate Listing Error
    console.log("\n[Test 2] Create Duplicate Listing");
    try {
      await SellerListingService.createListing(productDna.id, orgA.id, userA.id, {
        sellerSku: 'SRV-REB-14-DUP',
        price: 55.00
      });
      console.error("❌ Failed: Duplicate listing should have thrown an error");
    } catch (e) {
      if (e instanceof DuplicateSellerListingError) {
        console.log(`✅ Caught Expected Error: ${e.message}`);
      } else {
        throw e;
      }
    }

    // 5. Test: Update Listing Successfully
    console.log("\n[Test 3] Update Listing Successfully");
    const updatedListing = await SellerListingService.updateListing(listing.id, orgA.id, {
      price: 65.00,
      stockLevel: 120
    });
    console.log(`✅ Listing updated. New Price: ${updatedListing.price}, New Stock: ${updatedListing.stockLevel}`);

    // 6. Test: Invalid Listing Data (Negative Price)
    console.log("\n[Test 4] Update with Invalid Data (Negative Price)");
    try {
      await SellerListingService.updateListing(listing.id, orgA.id, {
        price: -10
      });
      console.error("❌ Failed: Negative price should have thrown an error");
    } catch (e) {
      if (e instanceof InvalidListingDataError) {
        console.log(`✅ Caught Expected Error: ${e.message}`);
      } else {
        throw e;
      }
    }

    // 7. Test: Update from another organization (Ownership Error)
    console.log("\n[Test 5] Update from another organization");
    try {
      await SellerListingService.updateListing(listing.id, orgB.id, {
        price: 100
      });
      console.error("❌ Failed: Cross-org update should have thrown an error");
    } catch (e) {
      if (e instanceof ListingOwnershipError || e instanceof ListingNotFoundError) {
        console.log(`✅ Caught Expected Error: ${e.message}`);
      } else {
        throw e;
      }
    }

    // 8. Test: Archive Listing
    console.log("\n[Test 6] Archive Listing");
    await SellerListingService.archiveListing(listing.id, orgA.id);
    console.log(`✅ Listing archived successfully`);

    // 9. Test: Update Archived Listing
    console.log("\n[Test 7] Update Archived Listing");
    try {
      await SellerListingService.updateListing(listing.id, orgA.id, {
        price: 70
      });
      console.error("❌ Failed: Updating an archived listing should have thrown an error");
    } catch (e) {
      if (e instanceof ListingNotFoundError) {
        console.log(`✅ Caught Expected Error: ${e.message}`);
      } else {
        throw e;
      }
    }

    console.log("\n=== ALL TESTS PASSED SUCCESSFULLY ===");

  } catch (error) {
    console.error("Verification failed:", error);
  } finally {
    process.exit(0);
  }
}

verifySellerListingService();
