const axios = require('axios');

async function registerOnRender() {
    try {
        console.log("Registering user on Render...");
        const res = await axios.post('https://ecommerce-platform-305.onrender.com/api/auth/register', {
            name: "Render Test Buyer",
            email: "render_test_buyer@example.com",
            password: "password123",
            role: "buyer",
            sectorIds: [1]
        });
        console.log("Success:", res.data);
    } catch (e) {
        console.log("Error:", e.response?.data || e.message);
    }
}
registerOnRender();
