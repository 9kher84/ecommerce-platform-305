const { initSequelize, User, sequelize } = require("./sequelize_setup");
const userController = require("./controllers/userController");

// Mock Request and Response objects
const mockReq = (user, body) => ({
  user,
  body,
});

const mockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.data = data;
    return res;
  };
  return res;
};

async function testDirectUpdate() {
  try {
    console.log("🚀 Starting Direct Controller Test...");

    // 1. Initialize DB
    await initSequelize();
    console.log("✅ Database connected");

    // 2. Create Test User
    const email = `direct_test_${Date.now()}@example.com`;
    const user = await User.create({
      name: "Direct Tester",
      email: email,
      password: "hashed_password",
      role: "buyer",
    });
    console.log(`👤 Created user: ${user.id}`);

    // 3. Test Update (Mobile & BusinessName)
    console.log("📝 Testing updateUserProfile controller...");

    const req = mockReq(
      { id: user.id },
      {
        mobile: "0599999999",
        businessName: "Direct Update Corp",
        notificationSettings: { email: false, whatsapp: true },
      },
    );
    const res = mockRes();

    // Call the controller directly
    await userController.updateUserProfile(req, res);

    // 4. Verify Response
    if (res.statusCode === 200 && res.data.success) {
      console.log("✅ Controller returned success");
      console.log("   Response Data:", res.data.user);
    } else {
      console.error("❌ Controller failed:", res.data || res.statusCode);
    }

    // 5. Verify Database
    const updatedUser = await User.findByPk(user.id);
    console.log("🔍 Verifying Database Record:");
    console.log(`   Mobile: ${updatedUser.mobile}`);
    console.log(`   Business: ${updatedUser.businessName}`);
    console.log(
      `   Notifications: ${JSON.stringify(updatedUser.notificationSettings)}`,
    );

    if (
      updatedUser.mobile === "0599999999" &&
      updatedUser.businessName === "Direct Update Corp"
    ) {
      console.log("🎉 TEST PASSED: Logic is correct and Database is updated.");
    } else {
      console.log("❌ TEST FAILED: Database was not updated correctly.");
    }
  } catch (error) {
    console.error("❌ Test Error:", error);
  } finally {
    await sequelize.close();
  }
}

testDirectUpdate();
