// check-database.js
const { sequelize, User } = require("./sequelize_setup");

async function checkUsers() {
  try {
    await sequelize.authenticate();
    console.log("✅ اتصال قاعدة البيانات ناجح");

    // جلب جميع المستخدمين
    const users = await User.findAll({
      attributes: [
        "id",
        "email",
        "name",
        "role",
        "isAdmin",
        "adminPermissions",
      ],
      order: [["createdAt", "DESC"]],
    });

    console.log("\n👥 المستخدمون في قاعدة البيانات:");
    console.log("==========================");

    if (users.length === 0) {
      console.log("❌ لا يوجد مستخدمون في قاعدة البيانات!");
      return;
    }

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   isAdmin: ${user.isAdmin}`);
      console.log(
        `   Owner? ${user.id === "cf8b5bd6-f905-4456-afc1-2bd65902e27a"}`,
      );
      if (user.adminPermissions) {
        console.log(`   Permissions: ${JSON.stringify(user.adminPermissions)}`);
      }
    });

    // تحقق إذا كان OWNER_ID موجود
    const ownerId = "cf8b5bd6-f905-4456-afc1-2bd65902e27a";
    const owner = await User.findByPk(ownerId);

    if (owner) {
      console.log("\n✅ تم العثور على المالك في قاعدة البيانات:");
      console.log(`   الاسم: ${owner.name}`);
      console.log(`   البريد: ${owner.email}`);
    } else {
      console.log(`\n❌ لم يتم العثور على المستخدم مع ID: ${ownerId}`);
      console.log("   تحقق من قيمة OWNER_ID في ملف .env");
    }
  } catch (error) {
    console.error("❌ خطأ في الاتصال بقاعدة البيانات:", error.message);
  }
}

checkUsers();
