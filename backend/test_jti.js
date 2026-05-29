const { User } = require("./sequelize_setup");
const jwt = require("jsonwebtoken");

(async () => {
  try {
    console.log("🧪 Testing JTI Inclusion in JWT...");

    // Mock User
    const user = User.build({ id: "test-user-id", role: "admin" });

    // Generate Token
    const token = user.getSignedJwtToken();
    console.log("   Token Generated.");

    // Verify and Decode
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("   Decoded Payload:", decoded);

    // Check for JTI
    if (decoded.jti) {
      console.log("   ✅ SUCCESS: JTI found:", decoded.jti);
    } else {
      console.error("   ❌ FAILURE: JTI missing!");
      process.exit(1);
    }

    // Check Expiration (approx 15 min)
    const expDuration = decoded.exp - decoded.iat;
    if (expDuration === 15 * 60) {
      console.log("   ✅ SUCCESS: Expiration is 15 minutes (900 seconds).");
    } else {
      console.warn(
        "   ⚠️ WARNING: Expiration is:",
        expDuration,
        "seconds. Expected 900.",
      );
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
})();
