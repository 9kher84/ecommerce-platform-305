const { User } = require("./sequelize_setup");
const jwt = require("jsonwebtoken");
const config = require("./config");

async function test() {
  try {
    console.log("Testing User.findAll...");
    const users = await User.findAll({ limit: 1 });
    if (users.length === 0) {
      console.log("No users found in DB.");
      process.exit(0);
    }
    const user = users[0];
    console.log("User found:", user.email, "ID:", user.id);

    console.log("Testing JWT signing and verification...");
    const token = user.getSignedJwtToken();
    console.log("Token generated:", token.substring(0, 20), "...");

    const decoded = jwt.verify(token, config.jwt.secret);
    console.log("Token verified. Decoded ID:", decoded.id);

    if (decoded.id === user.id) {
      console.log("✅ ID match success.");
    } else {
      console.error("❌ ID mismatch!");
    }

    console.log("Testing User.findByPk...");
    const foundUser = await User.findByPk(decoded.id);
    if (foundUser) {
      console.log("✅ User.findByPk success:", foundUser.email);
    } else {
      console.error("❌ User.findByPk failed for ID:", decoded.id);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error details:", err);
    process.exit(1);
  }
}

test();
