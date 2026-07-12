module.paths.push('c:\\Users\\s9khr\\sasasa\\ecommerce-platform\\backend\\node_modules');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const outDir = 'C:\\Users\\s9khr\\sasasa\\ecommerce-platform\\brain\\ca6fc704-67ed-4861-8a60-b44ba7bd82cf\\scratch';

async function test() {
  try {
    try {
      const res1 = await axios.get('https://ecommerce-platform-305.onrender.com/api/requests');
      fs.writeFileSync(path.join(outDir, 'res1.json'), JSON.stringify(res1.data, null, 2));
    } catch (e) {
      fs.writeFileSync(path.join(outDir, 'res1.json'), JSON.stringify({ error: e.message, data: e.response ? e.response.data : null }, null, 2));
    }

    try {
      const res2 = await axios.get('https://ecommerce-platform-305.onrender.com/api/requests?categoryId=3');
      fs.writeFileSync(path.join(outDir, 'res2.json'), JSON.stringify(res2.data, null, 2));
    } catch (e) {
      fs.writeFileSync(path.join(outDir, 'res2.json'), JSON.stringify({ error: e.message, data: e.response ? e.response.data : null }, null, 2));
    }

    let token = '';
    try {
      const res3 = await axios.post('https://ecommerce-platform-305.onrender.com/api/auth/login', {
        email: "buyer1@test.com",
        password: "Test@12345"
      });
      const loginRes = { ...res3.data };
      if (loginRes.user && loginRes.user.password) loginRes.user.password = '[HIDDEN]';
      fs.writeFileSync(path.join(outDir, 'res3.json'), JSON.stringify(loginRes, null, 2));
      
      const cookies = res3.headers['set-cookie'];
      const cookieHeader = cookies ? cookies.map(c => c.split(';')[0]).join('; ') : '';
      
      const authHeaders = {};
      if (res3.data.token) {
        authHeaders['Authorization'] = `Bearer ${res3.data.token}`;
      }
      if (cookieHeader) {
        authHeaders['Cookie'] = cookieHeader;
      }

      try {
        const res4 = await axios.get('https://ecommerce-platform-305.onrender.com/api/requests/my-requests', {
          headers: authHeaders
        });
        fs.writeFileSync(path.join(outDir, 'res4.json'), JSON.stringify(res4.data, null, 2));
      } catch (e) {
        fs.writeFileSync(path.join(outDir, 'res4.json'), JSON.stringify({ error: e.message, data: e.response ? e.response.data : null }, null, 2));
      }

      const reqId = "12c40060-9766-433d-9f2c-f918a84d9a4a";
      try {
        const res5 = await axios.get(`https://ecommerce-platform-305.onrender.com/api/requests/${reqId}`, {
          headers: authHeaders
        });
        fs.writeFileSync(path.join(outDir, 'res5.json'), JSON.stringify(res5.data, null, 2));
      } catch (e) {
        fs.writeFileSync(path.join(outDir, 'res5.json'), JSON.stringify({ error: e.message, data: e.response ? e.response.data : null }, null, 2));
      }

    } catch (e) {
      fs.writeFileSync(path.join(outDir, 'res3.json'), JSON.stringify({ error: e.message, data: e.response ? e.response.data : null }, null, 2));
    }

  } catch (err) {
    console.error("Test Error:", err.message);
  }
}

test();
