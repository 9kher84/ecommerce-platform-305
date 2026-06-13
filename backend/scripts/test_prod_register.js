const axios = require('axios');

async function testRegister() {
  try {
    const baseURL = 'https://ecommerce-platform-305.onrender.com/api';
    
    console.log("1. Testing Registration for newuser@test.com...");
    const regRes = await axios.post(`${baseURL}/auth/register`, {
      name: 'New Buyer',
      email: 'newuser@test.com',
      password: 'Test@12345',
      role: 'buyer',
      sectorIds: [1]
    });
    
    console.log("Registration Response:");
    console.log(JSON.stringify(regRes.data, null, 2));
    
  } catch (error) {
    console.error("\nError occurred during registration:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testRegister();
