const axios = require('axios');

async function testProd() {
  try {
    const baseURL = 'https://ecommerce-platform-305.onrender.com/api';
    
    console.log("1. Logging in...");
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: 'buyer1@test.com',
      password: 'Test@12345'
    });
    
    const token = loginRes.data.token;
    console.log("Login Response:");
    console.log(JSON.stringify(loginRes.data, null, 2));
    
    const cookies = loginRes.headers['set-cookie'];
    
    console.log("\n2. Creating Purchase Request...");
    
    // We will send both Bearer token and Cookie just to be safe based on how the backend auth is configured
    const prRes = await axios.post(`${baseURL}/requests`, {
      title: "طلب اختبار نهائي من Render",
      description: "هذا طلب تم إنشاؤه بعد إصلاح قاعدة البيانات",
      sectorId: 1,  // Usually sectorId is required based on local testing
      categoryId: 1,
      quantity: 1,
      unit: 'piece'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': cookies ? cookies.join('; ') : `token=${token}`
      }
    });
    
    console.log("Create Request Response:");
    console.log(JSON.stringify(prRes.data, null, 2));
    
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

testProd();
