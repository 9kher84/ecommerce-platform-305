require('dotenv').config();
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

async function testJWT() {
  try {
    const secret = process.env.JWT_SECRET || "supersecret";
    
    // Simulate what getSignedJwtToken does in User.js
    const token = jwt.sign(
      {
        id: '8e829b28-e991-4449-be9f-0835468775f8',
        role: 'buyer',
        jti: uuidv4(),
      },
      secret,
      { expiresIn: "8h" } // Our updated expiration
    );
    
    const decoded = jwt.decode(token);

    console.log("Token:", token);
    console.log("\nDecoded Payload:");
    console.log(JSON.stringify(decoded, null, 2));

    const iat = new Date(decoded.iat * 1000);
    const exp = new Date(decoded.exp * 1000);
    const diffHours = (exp - iat) / (1000 * 60 * 60);

    console.log(`\nIssued At: ${iat.toLocaleString()}`);
    console.log(`Expires At: ${exp.toLocaleString()}`);
    console.log(`Validity Duration: ${diffHours} hours`);

  } catch (error) {
    console.error("Error:", error);
  }
}

testJWT();
