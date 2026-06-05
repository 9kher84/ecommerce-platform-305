/**
 * generateTestData.js - Final Correct Version
 * Exact DB column names, correct enum values, correct FK references.
 */

const { sequelize } = require('../sequelize_setup');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function generateData() {
  try {
    await sequelize.authenticate();
    console.log('--- ✅ Connected to DB ---\n');

    const passwordHash = await bcrypt.hash('Test@12345', 10);

    // ===========================================================
    // STEP 1: Create 9 Test Users (3 buyer, 3 seller, 3 admin)
    // ===========================================================
    console.log('--- Step 1: Creating Test Users ---');
    const roles = ['buyer', 'seller', 'admin'];
    for (const role of roles) {
      for (let i = 1; i <= 3; i++) {
        const id    = uuidv4();
        const email = `${role}${i}@testdata.com`;
        const name  = `Test ${role} ${i}`;
        // Insert into both users (lowercase) and "Users" (uppercase) to satisfy all FKs
        try {
          await sequelize.query(
            `INSERT INTO users (id, name, email, password, role, "isActive", "lastWeekReset", "withdrawalPeriodStart", "createdAt", "updatedAt")
             VALUES (:id, :name, :email, :pwd, :role, true, NOW(), NOW(), NOW(), NOW())
             ON CONFLICT (email) DO NOTHING;`,
            { replacements: { id, name, email, pwd: passwordHash, role } }
          );
        } catch (e) { /* already exists */ }
        
        // Sync into the capitalized "Users" table that PurchaseRequests FK points to
        try {
          const [existing] = await sequelize.query(`SELECT id FROM "Users" WHERE email = :email;`, { replacements: { email } });
          if (!existing.length) {
            await sequelize.query(
              `INSERT INTO "Users" (id, name, email, password, role, "isActive", "createdAt", "updatedAt")
               VALUES (:id, :name, :email, :pwd, :role, true, NOW(), NOW())
               ON CONFLICT (email) DO NOTHING;`,
              { replacements: { id, name, email, pwd: passwordHash, role } }
            );
          }
        } catch (e) { console.warn(`  ⚠️  Users (cap) ${email}: ${e.message.split('\n')[0]}`); }
      }
    }
    // Fetch from the capitalized "Users" table (used by FK)
    const [allUsers] = await sequelize.query(`SELECT id, email, role FROM "Users" WHERE email LIKE '%@testdata.com';`);
    const buyers  = allUsers.filter(u => u.role === 'buyer');
    const sellers = allUsers.filter(u => u.role === 'seller');
    const [allUsersLower] = await sequelize.query(`SELECT id FROM users WHERE email LIKE '%@testdata.com';`);
    const allIds  = allUsersLower.map(u => u.id);
    console.log(`  ✅ ${allUsers.length} test users ready (${buyers.length} buyers, ${sellers.length} sellers)\n`);
    if (!buyers.length || !sellers.length) throw new Error('No buyers or sellers created');

    // ===========================================================
    // STEP 2: Categories (5 new ones using SECTOR type)
    // ===========================================================
    console.log('--- Step 2: Creating Categories ---');
    const catDefs = [
      { ar: 'تقنية',    en: 'Technology'   },
      { ar: 'تسويق',    en: 'Marketing'    },
      { ar: 'بناء',     en: 'Construction' },
      { ar: 'استشارات', en: 'Consulting'   },
      { ar: 'تعليم',    en: 'Education'    }
    ];
    for (const c of catDefs) {
      try {
        await sequelize.query(
          `INSERT INTO "Categories" (name_ar, name_en, type, "isActive", "createdAt", "updatedAt")
           VALUES (:ar, :en, 'SECTOR', true, NOW(), NOW())
           ON CONFLICT DO NOTHING;`,
          { replacements: { ar: c.ar, en: c.en } }
        );
      } catch (e) { console.warn(`  ⚠️  Category "${c.ar}": ${e.message.split('\n')[0]}`); }
    }
    const [allCats] = await sequelize.query(
      `SELECT id FROM "Categories" WHERE name_ar IN ('تقنية','تسويق','بناء','استشارات','تعليم');`
    );
    console.log(`  ✅ ${allCats.length} categories ready\n`);
    if (!allCats.length) throw new Error('No categories found');

    // ===========================================================
    // STEP 3: 50 Purchase Requests
    // status enum: rfq_published, quoting, awaiting_decision, completed, expired
    // sectorId: FK to Categories.id (NOT NULL) → use same as categoryId
    // ===========================================================
    console.log('--- Step 3: Creating 50 Purchase Requests ---');
    const cities     = ['Riyadh', 'Jeddah', 'Dammam', 'Mecca', 'Medina'];
    // Only valid enum values
    const prStatuses = ['rfq_published', 'rfq_published', 'rfq_published', 'quoting', 'expired'];
    let prCount = 0;

    for (let i = 1; i <= 50; i++) {
      const buyer  = buyers[Math.floor(Math.random() * buyers.length)];
      const cat    = allCats[Math.floor(Math.random() * allCats.length)];
      const city   = cities[Math.floor(Math.random() * cities.length)];
      const minP   = Math.floor(Math.random() * 5000) + 500;
      const maxP   = minP + Math.floor(Math.random() * 10000) + 1000;
      const status = prStatuses[Math.floor(Math.random() * prStatuses.length)];
      const qty    = Math.floor(Math.random() * 100) + 1;
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - Math.floor(Math.random() * 30));
      const pd = pastDate.toISOString();

      try {
        await sequelize.query(
          `INSERT INTO "PurchaseRequests"
             (id, title, description, quantity, unit, status, delivery_city,
              price_range_min, price_range_max, "deliveryLocations",
              "categoryId", "sectorId", "userId", "is_active", "createdAt", "updatedAt")
           VALUES
             (:id, :title, :desc, :qty, 'قطعة', :status, :city,
              :minP, :maxP, :dloc::jsonb,
              :catId, :catId, :userId, true, :pd, :pd);`,
          {
            replacements: {
              id: uuidv4(),
              title: `طلب شراء تجريبي #${i}`,
              desc:  `وصف تجريبي للطلب رقم ${i}`,
              qty, status, city, minP, maxP,
              dloc: JSON.stringify([{ city }]),
              catId: cat.id,
              userId: buyer.id,
              pd
            }
          }
        );
        prCount++;
      } catch (e) {
        console.warn(`  ⚠️  PR #${i}: ${e.message.split('\n')[0]}`);
      }
    }
    console.log(`  ✅ ${prCount}/50 Purchase Requests created\n`);

    // ===========================================================
    // STEP 4: ~150 Price Quotes
    // Columns: id, purchaseRequestId, sellerId, price, message, status, createdAt, updatedAt
    // ===========================================================
    console.log('--- Step 4: Creating ~150 Price Quotes ---');
    const [pqCols] = await sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='PriceQuotes';`
    );
    const pqSet      = new Set(pqCols.map(c => c.column_name));
    const prIdField  = '"purchaseRequestId"'; // confirmed via schema inspection
    const priceField = '"amount"';             // confirmed: column is 'amount' not 'price'
    const msgField   = pqSet.has('notes') ? 'notes' : (pqSet.has('message') ? 'message' : 'notes');

    // Get valid PriceQuote status enum values
    let qStatusVals = ['pending'];
    try {
      const [qsv] = await sequelize.query(
        `SELECT unnest(enum_range(NULL::"enum_PriceQuotes_status"))::text as v;`
      );
      qStatusVals = qsv.map(x => x.v);
    } catch(_) {}
    const pendingStatus   = qStatusVals.find(v => v === 'pending')   || qStatusVals[0];
    const acceptedStatus  = qStatusVals.find(v => v === 'accepted')  || qStatusVals[0];
    const rejectedStatus  = qStatusVals.find(v => v === 'rejected')  || qStatusVals[0];
    const qStatusPool     = [pendingStatus, pendingStatus, pendingStatus, acceptedStatus, rejectedStatus];

    const [allPRs] = await sequelize.query(
      `SELECT id, price_range_min FROM "PurchaseRequests" WHERE title LIKE 'طلب شراء تجريبي #%' LIMIT 50;`
    );

    let qCount = 0;
    for (const pr of allPRs) {
      if (qCount >= 150) break;
      const shuffled = [...sellers].sort(() => 0.5 - Math.random()).slice(0, 3);
      for (const seller of shuffled) {
        if (qCount >= 150) break;
        const base   = Number(pr.price_range_min) || 1000;
        const price  = Math.floor(base * (0.8 + Math.random() * 0.4));
        const status = qStatusPool[Math.floor(Math.random() * qStatusPool.length)];
        try {
          await sequelize.query(
            `INSERT INTO "PriceQuotes" (id, ${prIdField}, "sellerId", ${priceField}, ${msgField}, status, "createdAt", "updatedAt")
             VALUES (:id, :prId, :sId, :price, :msg, :status, NOW(), NOW())`,
            { replacements: { id: uuidv4(), prId: pr.id, sId: seller.id, price, msg: 'عرض سعر تجريبي', status } }
          );
          qCount++;
        } catch (e) {
          // retry without status column
          try {
            await sequelize.query(
              `INSERT INTO "PriceQuotes" (id, ${prIdField}, "sellerId", ${priceField}, ${msgField}, "createdAt", "updatedAt")
               VALUES (:id, :prId, :sId, :price, :msg, NOW(), NOW())`,
              { replacements: { id: uuidv4(), prId: pr.id, sId: seller.id, price, msg: 'عرض سعر تجريبي' } }
            );
            qCount++;
          } catch (_) { /* skip */ }
        }
      }
    }
    console.log(`  ✅ ${qCount} Quotes created\n`);

    // ===========================================================
    // STEP 5: 10 Messages
    // Columns: id, requestId (NOT NULL FK), senderId, receiverId, content, isRead, createdAt, updatedAt
    // ===========================================================
    console.log('--- Step 5: Creating 10 Messages ---');
    const prIdsForMsg = allPRs.map(p => p.id);
    let msgCount = 0;
    if (!prIdsForMsg.length) {
      console.warn('  ⚠️  No PRs available for messages — skipping');
    } else {
      for (let i = 0; i < 10; i++) {
        const prId   = prIdsForMsg[Math.floor(Math.random() * prIdsForMsg.length)];
        const sender = allIds[Math.floor(Math.random() * allIds.length)];
        let recv     = allIds[Math.floor(Math.random() * allIds.length)];
        while (recv === sender) recv = allIds[Math.floor(Math.random() * allIds.length)];
        try {
          await sequelize.query(
            `INSERT INTO "Messages" (id, "requestId", "senderId", "receiverId", content, "isRead", "createdAt", "updatedAt")
             VALUES (:id, :prId, :sid, :rid, :content, :isRead, NOW(), NOW())`,
            { replacements: { id: uuidv4(), prId, sid: sender, rid: recv, content: `رسالة تجريبية رقم ${i+1}`, isRead: Math.random() > 0.7 } }
          );
          msgCount++;
        } catch (e) { console.warn(`  ⚠️  Message ${i+1}: ${e.message.split('\n')[0]}`); }
      }
    }
    console.log(`  ✅ ${msgCount} Messages created\n`);

    // ===========================================================
    // STEP 6: 10 Notifications
    // Columns: id, title, message, type, isRead, userId, createdAt, updatedAt
    // ===========================================================
    console.log('--- Step 6: Creating 10 Notifications ---');
    const notifTypes = ['info', 'warning', 'success'];
    let notifCount = 0;
    for (let i = 0; i < 10; i++) {
      const uid  = allIds[Math.floor(Math.random() * allIds.length)];
      const type = notifTypes[Math.floor(Math.random() * notifTypes.length)];
      try {
        await sequelize.query(
          `INSERT INTO "Notifications" (id, title, message, type, "isRead", "userId", "createdAt", "updatedAt")
           VALUES (:id, :title, :msg, :type, false, :uid, NOW(), NOW())`,
          { replacements: { id: uuidv4(), title: `إشعار تجريبي #${i+1}`, msg: `محتوى الإشعار رقم ${i+1}`, type, uid } }
        );
        notifCount++;
      } catch (e) { console.warn(`  ⚠️  Notif ${i+1}: ${e.message.split('\n')[0]}`); }
    }
    console.log(`  ✅ ${notifCount} Notifications created\n`);

    // ===========================================================
    // STEP 7: Verification
    // ===========================================================
    console.log('='.repeat(50));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(50));

    const [roleCounts] = await sequelize.query(
      `SELECT role, COUNT(*) as count FROM users WHERE email LIKE '%@testdata.com' GROUP BY role ORDER BY role;`
    );
    const [[prTotal]] = await sequelize.query(
      `SELECT COUNT(*) as count FROM "PurchaseRequests" WHERE title LIKE 'طلب شراء تجريبي #%';`
    );
    const [[qTotal]]  = await sequelize.query(`SELECT COUNT(*) as count FROM "PriceQuotes";`);
    const [[mTotal]]  = await sequelize.query(`SELECT COUNT(*) as count FROM "Messages";`);
    const [[nTotal]]  = await sequelize.query(`SELECT COUNT(*) as count FROM "Notifications";`);

    console.log('\nUsers by role (@testdata.com):');
    roleCounts.forEach(r => console.log(`  ${r.role.padEnd(12)} → ${r.count}`));
    console.log(`\nPurchase Requests (testdata)  → ${prTotal.count}`);
    console.log(`Price Quotes (total)          → ${qTotal.count}`);
    console.log(`Messages (total)              → ${mTotal.count}`);
    console.log(`Notifications (total)         → ${nTotal.count}`);
    console.log('\n🎉 Test Data Generation Complete!');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Fatal Error:', err.message);
    process.exit(1);
  }
}

generateData();
