const axios = require('axios');

async function testLogout() {
  try {
    const baseURL = 'https://ecommerce-backend-305.onrender.com/api';
    
    console.log("1. Logging in as newuser@test.com...");
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: 'newuser@test.com',
      password: 'Test@12345'
    });
    
    const token = loginRes.data.token;
    const cookies = loginRes.headers['set-cookie'];
    console.log("Login successful! Token received.");
    
    console.log("\n2. Calling Logout API...");
    const logoutRes = await axios.post(`${baseURL}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': cookies ? cookies.join('; ') : `token=${token}`
      }
    });
    
    console.log("Logout Response Status:", logoutRes.status);
    console.log("Logout Response Data:");
    console.log(JSON.stringify(logoutRes.data, null, 2));
    
    const logoutCookies = logoutRes.headers['set-cookie'];
    console.log("\nSet-Cookie Header after logout:");
    console.log(logoutCookies);

  } catch (error) {
    console.error("\nError occurred:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

testLogout();
