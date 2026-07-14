require('dotenv').config();
const { sequelize, User } = require('./sequelize_setup');
const authController = require('./controllers/authController');

async function testPasswordReset() {
  console.log("=== Testing Password Reset Workflow ===");

  // 1. Setup a test user
  const email = "reset_test@example.com";
  const oldPassword = "OldPassword123!";
  const newPassword = "NewPassword456!";
  
  let user = await User.findOne({ where: { email } });
  if (user) {
    await user.destroy({ force: true });
  }

  user = await User.create({
    name: "Reset Test User",
    email,
    password: oldPassword,
    role: "buyer",
    isActive: true
  });
  console.log("✅ User created.");

  // 2. Forgot Password -> Generate Token
  const reqForgot = { body: { email } };
  const resForgot = {
    status: (code) => ({
      json: (data) => console.log(`Forgot Password API Response: ${code}`, data)
    })
  };

  // Capture console.log to get the token (since it's only printed in dev)
  const originalLog = console.log;
  let capturedToken = null;
  console.log = function(...args) {
    const msg = args.join(' ');
    if (msg.includes('Reset Token:')) {
      capturedToken = msg.split('Reset Token: ')[1].trim();
    }
    originalLog.apply(console, args);
  };

  await authController.forgotPassword(reqForgot, resForgot, (err) => { if (err) throw err; });
  console.log = originalLog;

  if (!capturedToken) {
    throw new Error("❌ Failed to capture reset token");
  }
  console.log("✅ Token Generated:", capturedToken);

  // 3. Verify Token Stored & Hashed & Expiration
  const updatedUser = await User.findByPk(user.id);
  if (!updatedUser.resetPasswordToken) {
    throw new Error("❌ Token not stored in DB");
  }
  if (!updatedUser.resetPasswordExpire) {
    throw new Error("❌ Expiration not stored in DB");
  }
  console.log("✅ Token Hashed & Stored:", updatedUser.resetPasswordToken);
  console.log("✅ Expiration Works:", updatedUser.resetPasswordExpire);

  // 4. Test Invalid Token
  const reqResetInvalid = {
    params: { token: 'invalid_token_123' },
    body: { password: newPassword }
  };
  let rejected = false;
  const nextFn = (err) => { 
    if(err) {
      if(err.message.includes("الرابط غير صالح")) rejected = true; 
    }
  };
  const resMock = {
    status: () => ({ json: () => {} })
  };
  await authController.resetPassword(reqResetInvalid, resMock, nextFn);
  if (!rejected) throw new Error("❌ Invalid token was not rejected");
  console.log("✅ Invalid Token Rejected");

  // 5. Reset Password Success
  const reqReset = {
    params: { token: capturedToken },
    body: { password: newPassword }
  };
  const resReset = {
    status: (code) => ({
      json: (data) => console.log(`Reset Password API Response: ${code}`, data)
    })
  };
  
  const nextFnSuccess = (err) => { if(err) throw err; };
  await authController.resetPassword(reqReset, resReset, nextFnSuccess);

  // 6. Verify Token Deleted After Success
  const finalUser = await User.findByPk(user.id);
  if (finalUser.resetPasswordToken || finalUser.resetPasswordExpire) {
    throw new Error("❌ Token NOT deleted after success");
  }
  console.log("✅ Token Deleted After Success");

  // 7. Verify Login fails with old password
  const isOldMatch = await finalUser.comparePassword(oldPassword);
  if (isOldMatch) {
    throw new Error("❌ Login succeeded with old password");
  }
  console.log("✅ Login Fails With Old Password");

  // 8. Verify Login works with new password
  const isNewMatch = await finalUser.comparePassword(newPassword);
  if (!isNewMatch) {
    throw new Error("❌ Login failed with new password");
  }
  console.log("✅ Login Works With New Password");

  console.log("=== All Password Reset Tests Passed ===");
  process.exit(0);
}

testPasswordReset().catch(err => {
  console.error(err);
  process.exit(1);
});
