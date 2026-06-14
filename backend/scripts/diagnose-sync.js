/**
 * DIAGNOSTIC SCRIPT — معزول تماماً، لا يعدل شيئاً
 * يجيب على: ما هو اسم جدول User الحقيقي؟ وأين ينهار الـ sync؟
 */

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });

// process.env.RENDER = "true";

const { Sequelize, DataTypes } = require("sequelize");
const config = require("../config");

const sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  { ...config.db, logging: false }
);

const User = require("../models/User")(sequelize, DataTypes);
const PaymentMethod = require("../models/PaymentMethod")(sequelize, DataTypes);

const run = async () => {
  console.log("=".repeat(60));
  console.log("🔬 DIAGNOSTIC: Isolated Sync Test");
  console.log("=".repeat(60));

  // ── Step 1: Connection
  try {
    await sequelize.authenticate();
    console.log("✅ DB Connection: OK");
  } catch (e) {
    console.error("❌ DB Connection FAILED:", e.message);
    process.exit(1);
  }

  // ── Step 2: What does Sequelize think the table name is?
  console.log("\n─── Table Name Resolution ───");
  console.log("User.getTableName()        =", User.getTableName());
  console.log("PaymentMethod.getTableName() =", PaymentMethod.getTableName());
  console.log(
    "PaymentMethod FK references.model =",
    PaymentMethod.rawAttributes?.userId?.references?.model ?? "NOT FOUND"
  );

  // ── Step 3: Test User.sync() alone
  console.log("\n─── Test 1: User.sync({ force: false }) ───");
  try {
    await User.sync({ force: false });
    console.log("✅ RESULT A: User.sync() SUCCEEDED");
  } catch (e) {
    console.error("❌ RESULT B: User.sync() FAILED →", e.message);
    await sequelize.close();
    return;
  }

  // ── Step 4: Test PaymentMethod.sync() alone
  console.log("\n─── Test 2: PaymentMethod.sync({ force: false }) ───");
  try {
    await PaymentMethod.sync({ force: false });
    console.log("✅ RESULT C: PaymentMethod.sync() SUCCEEDED → مشكلة في ترتيب initSequelize فقط");
  } catch (e) {
    console.error("❌ RESULT A: PaymentMethod.sync() FAILED →", e.message);
    console.log("\n📌 DIAGNOSIS: FK references.model لا يطابق اسم الجدول الحقيقي");
  }

  await sequelize.close();
  console.log("\n" + "=".repeat(60));
};

run();
