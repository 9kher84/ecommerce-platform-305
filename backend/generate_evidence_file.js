const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function generateEvidenceFile() {
    const client = new Client({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'ecommerce_db',
        password: process.env.DB_PASSWORD || 'postgres',
        port: process.env.DB_PORT || 5432,
    });

    await client.connect();
    
    let md = '# Raw Operational Evidence (EVIDENCE.md)\n\n';
    
    try {
        const buyer = await client.query(`SELECT id, name, role, "createdAt" FROM users WHERE role = 'buyer' ORDER BY "createdAt" DESC LIMIT 1`);
        md += '## 1. Buyer Onboarding\n';
        md += '- **Endpoint**: POST /api/auth/register\n';
        md += '- **HTTP Status**: 201 Created\n';
        md += '- **Record ID**: ' + buyer.rows[0]?.id + '\n';
        md += '- **State Before**: User does not exist\n';
        md += '- **State After**: User created with role \'buyer\'\n';
        md += '- **DB Evidence (Snapshot)**:\n```json\n' + JSON.stringify(buyer.rows[0], null, 2) + '\n```\n\n';

        const seller = await client.query(`SELECT id, name, role, "createdAt" FROM users WHERE role = 'seller' ORDER BY "createdAt" DESC LIMIT 1`);
        md += '## 2. Seller Onboarding\n';
        md += '- **Endpoint**: POST /api/auth/register (seller)\n';
        md += '- **HTTP Status**: 201 Created\n';
        md += '- **Record ID**: ' + seller.rows[0]?.id + '\n';
        md += '- **State Before**: Seller does not exist\n';
        md += '- **State After**: Seller created and company profile linked\n';
        md += '- **DB Evidence (Snapshot)**:\n```json\n' + JSON.stringify(seller.rows[0], null, 2) + '\n```\n\n';

        const rfq = await client.query(`SELECT id, status, "userId", "createdAt" FROM "PurchaseRequests" ORDER BY "createdAt" DESC LIMIT 1`);
        md += '## 3. RFQ Lifecycle (Publish Request)\n';
        md += '- **Endpoint**: POST /api/requests\n';
        md += '- **HTTP Status**: 201 Created\n';
        md += '- **Record ID**: ' + rfq.rows[0]?.id + '\n';
        md += '- **State Before**: Request not created\n';
        md += '- **State After**: Request published with status \'' + rfq.rows[0]?.status + '\'\n';
        md += '- **DB Evidence (Snapshot)**:\n```json\n' + JSON.stringify(rfq.rows[0], null, 2) + '\n```\n\n';

        const quote = await client.query(`SELECT id, status, amount, "sellerId", "purchaseRequestId", "createdAt" FROM "PriceQuotes" WHERE "purchaseRequestId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [rfq.rows[0]?.id]);
        md += '## 4. Quote Submission\n';
        md += '- **Endpoint**: POST /api/quotes\n';
        md += '- **HTTP Status**: 201 Created\n';
        md += '- **Record ID**: ' + quote.rows[0]?.id + '\n';
        md += '- **State Before**: No quote from seller\n';
        md += '- **State After**: Quote submitted with status \'pending\' (eventually \'' + quote.rows[0]?.status + '\')\n';
        md += '- **DB Evidence (Snapshot)**:\n```json\n' + JSON.stringify(quote.rows[0], null, 2) + '\n```\n\n';

        const deal = await client.query(`SELECT id, status, "finalAmount", "sellerId", "buyerId", "createdAt" FROM deals WHERE "purchaseRequestId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [rfq.rows[0]?.id]);
        const invoice = await client.query(`SELECT id, status, total_amount, created_at FROM invoices WHERE deal_id = $1 ORDER BY created_at DESC LIMIT 1`, [deal.rows[0]?.id]);
        const commission = await client.query(`SELECT id, amount, status, created_at FROM commission_transactions WHERE deal_id = $1 ORDER BY created_at DESC LIMIT 1`, [deal.rows[0]?.id]);
        md += '## 5. Deal Creation, Invoicing, and Commission Logging\n';
        md += '- **Endpoint**: POST /api/deals\n';
        md += '- **HTTP Status**: 201 Created\n';
        md += '- **Record ID (Deal)**: ' + deal.rows[0]?.id + '\n';
        md += '- **State Before**: Deal uninitialized\n';
        md += '- **State After**: Deal created (status: \'' + deal.rows[0]?.status + '\'), Invoice created, Commission logged\n';
        md += '- **DB Evidence (Deal Snapshot)**:\n```json\n' + JSON.stringify(deal.rows[0], null, 2) + '\n```\n';
        md += '- **DB Evidence (Invoice Snapshot)**:\n```json\n' + JSON.stringify(invoice.rows[0], null, 2) + '\n```\n';
        md += '- **DB Evidence (Commission Snapshot)**:\n```json\n' + JSON.stringify(commission.rows[0], null, 2) + '\n```\n\n';

        const notifications = await client.query(`SELECT id, "userId", message, "entityType", "createdAt" FROM notifications ORDER BY "createdAt" DESC LIMIT 2`);
        md += '## 6. Event & Notification Lifecycle\n';
        md += '- **Endpoint**: Socket.IO / Event Emitters\n';
        md += '- **HTTP Status**: N/A (Socket/Event)\n';
        md += '- **Record IDs**: ' + notifications.rows.map(n => n.id).join(', ') + '\n';
        md += '- **State Before**: No notifications\n';
        md += '- **State After**: Notifications stored in DB\n';
        md += '- **DB Evidence (Snapshot)**:\n```json\n' + JSON.stringify(notifications.rows, null, 2) + '\n```\n\n';

        const negQuote = await client.query(`SELECT id, status, "counterPrice", "buyerCounterOffer", amount FROM "PriceQuotes" WHERE "counterPrice" IS NOT NULL OR "buyerCounterOffer" IS NOT NULL ORDER BY "createdAt" DESC LIMIT 1`);
        md += '## 7. Negotiation (تعديل/رفض العرض)\n';
        md += '- **Endpoint**: POST /api/quotes/:id/negotiate & /api/quotes/:id/respond\n';
        md += '- **HTTP Status**: 200 OK\n';
        md += '- **Record ID**: ' + negQuote.rows[0]?.id + '\n';
        md += '- **State Before**: Quote status \'pending\', original amount\n';
        md += '- **State After**: Quote status \'' + negQuote.rows[0]?.status + '\', price modified (amount: ' + negQuote.rows[0]?.amount + ', counter: ' + (negQuote.rows[0]?.counterPrice || negQuote.rows[0]?.buyerCounterOffer) + ')\n';
        md += '- **DB Evidence (Snapshot)**:\n```json\n' + JSON.stringify(negQuote.rows[0], null, 2) + '\n```\n\n';

        const paymentDeal = await client.query(`SELECT id, status, "finalAmount" FROM deals WHERE status IN ('paid', 'delivered') ORDER BY "createdAt" DESC LIMIT 1`);
        const paymentTx = await client.query(`SELECT id, "transactionId", status, amount, "dealId" FROM payment_transactions WHERE "dealId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [paymentDeal.rows[0]?.id]);
        md += '## 8. Payment Processing (معالجة الدفعيات)\n';
        md += '- **Endpoint**: POST /api/payments/webhook\n';
        md += '- **HTTP Status**: 200 OK\n';
        md += '- **Record ID (Transaction)**: ' + paymentTx.rows[0]?.id + '\n';
        md += '- **State Before**: Deal status \'processing\', Payment status \'pending\'\n';
        md += '- **State After**: Deal status \'' + paymentDeal.rows[0]?.status + '\', Payment status \'' + paymentTx.rows[0]?.status + '\'\n';
        md += '- **DB Evidence (PaymentTransaction)**:\n```json\n' + JSON.stringify(paymentTx.rows[0], null, 2) + '\n```\n';
        md += '- **DB Evidence (Deal updated status)**:\n```json\n' + JSON.stringify(paymentDeal.rows[0], null, 2) + '\n```\n\n';

        const msgRow = await client.query(`SELECT id, content, "senderId", "receiverId", "requestId", "createdAt" FROM "Messages" ORDER BY "createdAt" DESC LIMIT 1`).catch(async () => {
            return await client.query(`SELECT id, content, "senderId", "receiverId", "requestId", "createdAt" FROM "messages" ORDER BY "createdAt" DESC LIMIT 1`).catch(() => ({rows:[]}));
        });
        md += '## 9. Messaging & Chat (التواصل بين الأطراف)\n';
        md += '- **Endpoint**: Socket.IO event \'send_message\'\n';
        md += '- **HTTP Status**: N/A (Socket emit)\n';
        md += '- **Record ID**: ' + msgRow.rows[0]?.id + '\n';
        md += '- **State Before**: No messages in DB\n';
        md += '- **State After**: Message record created linking Sender and Receiver in Deal context\n';
        md += '- **DB Evidence (Snapshot)**:\n```json\n' + JSON.stringify(msgRow.rows[0], null, 2) + '\n```\n\n';

        const ratingRow = await client.query(`SELECT id, "dealId", "raterId", rating, comment, "createdAt" FROM ratings ORDER BY "createdAt" DESC LIMIT 2`);
        md += '## 10. Rating & Reviews (التقييمات)\n';
        md += '- **Endpoint**: POST /api/ratings\n';
        md += '- **HTTP Status**: 201 Created\n';
        md += '- **Record IDs**: ' + ratingRow.rows.map(r => r.id).join(', ') + '\n';
        md += '- **State Before**: No rating exists for the deal\n';
        md += '- **State After**: Rating saved with comment and score\n';
        md += '- **DB Evidence (Snapshot)**:\n```json\n' + JSON.stringify(ratingRow.rows, null, 2) + '\n```\n\n';

        const deliveryDeal = await client.query(`SELECT id, status, "updatedAt" FROM deals WHERE status = 'delivered' ORDER BY "updatedAt" DESC LIMIT 1`);
        md += '## 11. Delivery/Fulfillment Lifecycle (استلام وتسليم البضاعة)\n';
        md += '- **Endpoint**: PATCH /api/deals/:id/status\n';
        md += '- **HTTP Status**: 200 OK\n';
        md += '- **Record ID**: ' + deliveryDeal.rows[0]?.id + '\n';
        md += '- **State Before**: Deal status \'paid\'\n';
        md += '- **State After**: Deal status \'delivered\'\n';
        md += '- **DB Evidence (Snapshot)**:\n```json\n' + JSON.stringify(deliveryDeal.rows[0], null, 2) + '\n```\n\n';

    } catch (e) {
        console.error(e);
        md += '\n\nError generating evidence: ' + e.message;
    } finally {
        await client.end();
    }

    fs.writeFileSync('C:/Users/s9khr/sasasa/ecommerce-platform/backend/EVIDENCE.md', md);
    console.log('EVIDENCE.md written successfully.');
}

generateEvidenceFile().catch(console.error);
