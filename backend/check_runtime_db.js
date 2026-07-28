const { initSequelize, sequelize } = require("./sequelize_setup");

async function checkDb() {
  try {
    await sequelize.authenticate();
    console.log("DB Config Database:", sequelize.config.database);
    console.log("DB Config Host:", sequelize.config.host);
    console.log("DB Name:", sequelize.getDatabaseName());

    console.log("--- 2 ---");
    const [db] = await sequelize.query("SELECT current_database() as db;");
    const [user] = await sequelize.query("SELECT current_user as usr;");
    const [ver] = await sequelize.query("SELECT version() as ver;");
    console.log("current_database:", db[0].db);
    console.log("current_user:", user[0].usr);
    console.log("version:", ver[0].ver);

    console.log("--- 3 ---");
    try {
      const [catCount] = await sequelize.query(`SELECT COUNT(*) as count FROM "Categories";`);
      console.log("Categories Count:", catCount[0].count);
      const [cats] = await sequelize.query(`SELECT id,name_en,type FROM "Categories" ORDER BY id LIMIT 5;`);
      console.log("Categories Data:", cats);
    } catch(e) { console.log("Categories Error:", e.message); }

    console.log("--- 4 ---");
    try {
      const [prCount] = await sequelize.query(`SELECT COUNT(*) as count FROM "PurchaseRequests";`);
      console.log("PurchaseRequests Count:", prCount[0].count);
      const [catIds] = await sequelize.query(`SELECT DISTINCT "categoryId" FROM "PurchaseRequests";`);
      console.log("PurchaseRequests categoryIds:", catIds.map(r => r.categoryId));
      const [secIds] = await sequelize.query(`SELECT DISTINCT "sectorId" FROM "PurchaseRequests";`);
      console.log("PurchaseRequests sectorIds:", secIds.map(r => r.sectorId));
    } catch(e) { console.log("PurchaseRequests Error:", e.message); }

    console.log("--- 6 ---");
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public' 
      ORDER BY table_name;
    `);
    console.log("Tables:", tables.map(t => t.table_name).join(", "));
    
  } catch (err) {
    console.error("Connection error:", err.message);
  } finally {
    await sequelize.close();
  }
}
checkDb();
