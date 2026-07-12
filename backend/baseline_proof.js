const axios = require('axios');

async function runAcceptanceGate() {
    console.log("=== RUNTIME ACCEPTANCE GATE (FINAL PRODUCTION VERIFICATION) ===");
    console.log("Target: https://ecommerce-platform-305.onrender.com\n");

    let token = "";

    try {
        console.log(`[1] Executing Login (test@test.com)...`);
        const loginRes = await axios.post('https://ecommerce-platform-305.onrender.com/api/auth/login', {
            email: 'test@test.com',
            password: 'password123'
        });

        console.log("=> Login Status Code:", loginRes.status);
        console.log("=> Raw Login Response Body:");
        console.log(JSON.stringify(loginRes.data, null, 2));

        token = loginRes.data.token;
        if (token) {
            const parts = token.split('.');
            if (parts.length === 3) {
                const hiddenSig = parts[2].substring(0, 5) + "...[HIDDEN]";
                console.log(`=> Extracted Token: ${parts[0]}.${parts[1]}.${hiddenSig}`);
            } else {
                console.log(`=> Extracted Token: ${token}`);
            }
        }

        const containsRedacted = token.includes("[REDACTED_BY_SOVEREIGN_PROTOCOL]");
        console.log(`=> Contains [REDACTED_BY_SOVEREIGN_PROTOCOL]?: ${containsRedacted ? "Yes" : "No"}`);

        if (containsRedacted) {
            console.log("\nSTOPPING: Token still contains redacted string. Deployment might not be finished.");
            return;
        }

    } catch (e) {
        console.log("Login failed:", e.response ? e.response.status : e.message);
        console.log(e.response ? JSON.stringify(e.response.data, null, 2) : "");
        return;
    }

    console.log("\n[2] Executing Purchase Request using the extracted Token...");
    try {
        const prRes = await axios.post('https://ecommerce-platform-305.onrender.com/api/requests', {
            title: "Test request",
            categoryId: 1,
            description: "Test purchase request for verification proof",
            budget: 5000,
            quantity: 1,
            unit: "piece"
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log("=> Request Status Code:", prRes.status);
        console.log("=> Raw Request Response Body:");
        console.log(JSON.stringify(prRes.data, null, 2));

    } catch (e) {
        if (e.response) {
            console.log("=> Request Status Code:", e.response.status);
            console.log("=> Raw Request Response Body:");
            console.log(JSON.stringify(e.response.data, null, 2));
        } else {
            console.log("=> Request Error:", e.message);
        }
    }
}

runAcceptanceGate();
