const jwt = require("jsonwebtoken");
const secret = "supersecret";
const payload = { id: "123" };
const token = jwt.sign(payload, secret);
console.log("Token:", token);
try {
  const decoded = jwt.verify(token, secret);
  console.log("Decoded:", decoded);
  console.log("✅ Success");
} catch (e) {
  console.error("❌ Failed:", e.message);
}
