const axios = require('axios');

async function test() {
  try {
    const baseURL = 'http://localhost:5000/api';
    
    console.log("Logging in as buyer1@testdata.com...");
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: 'buyer1@testdata.com',
      password: 'Test@12345'
    });
    
    const token = loginRes.data.token;
    console.log("Login successful. Token received.");
    
    console.log("Creating purchase request...");
    // Fetch a valid SECTOR to use
    const sectorsRes = await axios.get(`${baseURL}/categories`);
    const sectors = sectorsRes.data.data.categories;
    
    // Try to find a sector that buyer1 belongs to, or just use the first one
    // First get buyer1's sectors via a direct DB query isn't possible here, so use first sector
    const sectorId = sectors[0]?.id;
    if (!sectorId) throw new Error("No categories/sectors found!");
    console.log(`Using sectorId: ${sectorId} (${sectors[0].name_en || sectors[0].name_ar})`);
    
    const prRes = await axios.post(`${baseURL}/requests`, {
      title: "Test Request from Script",
      description: "Testing buyer permission CREATE_REQUEST",
      quantity: 5,
      unit: "piece",
      sectorId: sectorId
    }, {
      headers: {
        Cookie: `token=${token}`
      }
    });
    
    console.log("Purchase request creation SUCCESS!");
    console.log(prRes.data);
    
  } catch (error) {
    console.error("Error occurred:", error.response ? JSON.stringify(error.response.data) : error.message);
  }
}

test();
