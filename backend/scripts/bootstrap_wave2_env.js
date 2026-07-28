const { sequelize, User, Category } = require('../sequelize_setup');
const { v4: uuidv4 } = require('uuid');

async function bootstrap() {
  console.log("🚀 Starting Wave 2 Environment Bootstrap...");

  try {
    await sequelize.authenticate();
    console.log("✅ Database connected.");

    // 1. Create Sectors
    const sectors = [
      { name_ar: 'إنشاءات', name_en: 'Construction', type: 'SECTOR' },
      { name_ar: 'مستشفيات', name_en: 'Hospitals', type: 'SECTOR' },
      { name_ar: 'حكومي', name_en: 'Government', type: 'SECTOR' },
      { name_ar: 'أسمنت', name_en: 'Cement', type: 'SECTOR' },
      { name_ar: 'حديد', name_en: 'Steel', type: 'SECTOR' },
      { name_ar: 'كهرباء', name_en: 'Electric', type: 'SECTOR' },
    ];

    const createdSectors = {};
    for (const s of sectors) {
      const [cat] = await Category.findOrCreate({
        where: { name_en: s.name_en },
        defaults: s
      });
      createdSectors[s.name_en] = cat.id;
    }
    console.log("✅ Sectors ensured.");

    // 2. Clear Old Demo Users if they exist
    const emailsToDelete = [
      'buyer.construction@test.com', 'buyer.hospital@test.com', 'buyer.gov@test.com',
      'seller.cement@test.com', 'seller.steel@test.com', 'seller.electric@test.com', 
      'seller.multi@test.com', 'seller.inactive@test.com', 'seller.suspended@test.com',
      'admin.demo@test.com'
    ];
    await User.destroy({ where: { email: emailsToDelete }, force: true });

    // 3. Create Buyers
    const buyers = [
      { name: 'Buyer Construction', email: 'buyer.construction@test.com', role: 'buyer', isActive: true },
      { name: 'Buyer Hospital', email: 'buyer.hospital@test.com', role: 'buyer', isActive: true },
      { name: 'Buyer Gov', email: 'buyer.gov@test.com', role: 'buyer', isActive: true },
    ];

    for (const b of buyers) {
      await User.create({ ...b, id: uuidv4(), password: 'password123', isEmailVerified: true });
    }
    console.log("✅ Buyers created.");

    // 4. Create Sellers and Link Sectors
    const sellers = [
      { name: 'Seller Cement', email: 'seller.cement@test.com', role: 'seller', isActive: true, sectors: ['Cement'] },
      { name: 'Seller Steel', email: 'seller.steel@test.com', role: 'seller', isActive: true, sectors: ['Steel'] },
      { name: 'Seller Electric', email: 'seller.electric@test.com', role: 'seller', isActive: true, sectors: ['Electric'] },
      { name: 'Seller Multi', email: 'seller.multi@test.com', role: 'seller', isActive: true, sectors: ['Steel', 'Electric', 'Cement'] },
      { name: 'Seller Inactive', email: 'seller.inactive@test.com', role: 'seller', isActive: false, sectors: ['Electric'] },
      { name: 'Seller Suspended', email: 'seller.suspended@test.com', role: 'seller', isActive: true, is_restricted: true, sectors: ['Steel'] },
    ];

    for (const s of sellers) {
      const user = await User.create({
        id: uuidv4(),
        name: s.name,
        email: s.email,
        role: s.role,
        isActive: s.isActive,
        is_restricted: s.is_restricted || false,
        password: 'password123',
        isEmailVerified: true
      });

      // Assign sectors
      if (s.sectors) {
        for (const secName of s.sectors) {
          const secId = createdSectors[secName];
          if (secId) {
            await user.addSector(secId);
          }
        }
      }
    }
    console.log("✅ Sellers created and linked to sectors.");

    // 5. Create Admin
    await User.create({
      id: uuidv4(),
      name: 'Admin Demo',
      email: 'admin.demo@test.com',
      role: 'admin',
      isActive: true,
      password: 'password123',
      isEmailVerified: true
    });
    console.log("✅ Admin created.");

    console.log("🎉 Bootstrap Complete! All sterile accounts are ready with password 'password123'.");
    process.exit(0);

  } catch (error) {
    console.error("❌ Bootstrap failed:", error);
    process.exit(1);
  }
}

bootstrap();
