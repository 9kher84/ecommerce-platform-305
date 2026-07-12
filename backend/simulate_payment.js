const axios = require('axios');
const { SystemSetting } = require('./sequelize_setup');
const { generateWebhookSignature } = require('./utils/paymentSecurity'); // might not exist, we'll check later
const config = require('./config');

const API_URL = 'http://localhost:5000/api';

async function simulatePayment() {
    console.log("=== Starting Payment Simulation ===");

    // 1. Enable Payment System
    try {
        await SystemSetting.upsert({ key: 'payment_system_enabled', value: 'true', type: 'boolean', group: 'payment' });
        console.log("✅ Payment System Enabled in DB");
    } catch (e) {
        console.error("Failed to enable payment system:", e.message);
    }

    // 2. Login as Buyer to get Token
    // From simulate_cycle.js, the buyer was buyer@example.com / Password123!
    let token;
    try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'buyer@example.com',
            password: 'Password123!'
        });
        token = loginRes.data.token;
        console.log("✅ Buyer Logged In");
    } catch (e) {
        console.error("Failed to login buyer:", e.response ? e.response.data : e.message);
        return;
    }

    // 3. Find latest Deal for this buyer
    let deal;
    try {
        // Just directly query DB instead of finding an API for it if it's easier, or use the invoice endpoint.
        const { sequelize } = require('./models');
        const latestDeal = await sequelize.models.deals.findOne({ order: [['createdAt', 'DESC']] });
        if (!latestDeal) {
            console.error("No deal found to pay for.");
            return;
        }
        deal = latestDeal;
        console.log("✅ Found Deal to Pay:", deal.id);
    } catch (e) {
        console.error("Failed to fetch deal:", e.message);
        return;
    }

    // 4. Initiate Payment
    let transactionId;
    try {
        const initiateRes = await axios.post(`${API_URL}/payment/initiate`, {
            dealId: deal.id,
            amount: 5000,
            paymentGateway: 'stripe',
            currency: 'SAR'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        transactionId = initiateRes.data.transaction.transactionId;
        console.log("✅ Payment Initiated! Transaction ID:", transactionId);
    } catch (e) {
        console.error("Failed to initiate payment:", e.response ? e.response.data : e.message);
        return;
    }

    // 5. Simulate Webhook Call
    // We need to sign it! Or we can bypass signature verification for the test. Let's see how `webhook` is handled.
    try {
        const payload = {
            gateway: 'stripe',
            event: 'payment.success',
            transactionId: transactionId,
            status: 'completed'
        };
        const crypto = require('crypto');
        const webhookSecret = config.payment.webhookSecret || 'test_secret';
        const signature = crypto.createHmac('sha256', webhookSecret).update(JSON.stringify(payload)).digest('hex');

        const webhookRes = await axios.post(`${API_URL}/payment/webhook`, payload, {
            headers: {
                'x-payment-signature': signature,
                'Content-Type': 'application/json'
            }
        });
        console.log("✅ Webhook Processed:", webhookRes.data);
    } catch (e) {
        console.error("Failed to process webhook:", e.response ? e.response.data : e.message);
        return;
    }
}

simulatePayment();
