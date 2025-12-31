const request = require('supertest');
const app = require('../backend/server');
const { PurchaseRequest, Quote } = require('../backend/models');

describe('🚨 State Machine Stress & Race Condition Tests', () => {
    let userToken, adminToken;

    beforeAll(async () => {
        // إنشاء توكنات اختبار
        userToken = 'test-user-token';
        adminToken = 'test-admin-token';
    });

    test('1. Race Condition: محاولة تغيير حالة RFQ من جهتين في نفس الوقت', async () => {
        const rfqId = 'test-rfq-race';

        // محاكاة طلبين متزامنين لتغيير الحالة
        const promises = [];

        for (let i = 0; i < 10; i++) {
            promises.push(
                request(app)
                    .patch(`/api/requests/${rfqId}/status`)
                    .set('Authorization', `Bearer ${userToken}`)
                    .send({ status: i % 2 === 0 ? 'published' : 'cancelled' })
            );
        }

        const results = await Promise.all(promises);

        // يجب أن ينجح واحد فقط أو جميعهم يفشلون
        const successCount = results.filter(r => r.status === 200).length;
        const conflictCount = results.filter(r => r.status === 409).length;

        expect(successCount).toBeLessThanOrEqual(1);
        console.log(`✅ Race Condition Test: ${successCount} نجاح, ${conflictCount} تعارض`);
    });

    test('2. State Validation: عدم السماح بحالات غير منطقية', async () => {
        const invalidTransitions = [
            { from: 'draft', to: 'completed' }, // غير مسموح
            { from: 'cancelled', to: 'published' }, // غير مسموح
            { from: 'completed', to: 'draft' } // غير مسموح
        ];

        for (const transition of invalidTransitions) {
            const response = await request(app)
                .post('/api/requests/test/transition')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(transition);

            expect(response.status).toBe(400);
            expect(response.body.error).toMatch(/غير مسموح/);
        }
    });

    test('3. Concurrent Quote Submissions: عرضان سعر لنفس RFQ', async () => {
        const rfqId = 'test-concurrent-rfq';
        const sellers = ['seller1', 'seller2', 'seller3'];

        const quotePromises = sellers.map(sellerId =>
            request(app)
                .post(`/api/quotes`)
                .set('Authorization', `Bearer ${sellerId}-token`)
                .send({
                    rfqId,
                    amount: Math.random() * 1000 + 100,
                    sellerId
                })
        );

        const results = await Promise.all(quotePromises);

        // يجب أن يقبل جميع العروض
        results.forEach(result => {
            expect([200, 201]).toContain(result.status);
        });

        console.log(`✅ تم تقديم ${results.filter(r => r.status === 201).length} عرض سعر`);
    });

    test('4. Audit Trail Integrity: تتبع كل تغيير حالة', async () => {
        const response = await request(app)
            .get(`/api/audit/rfq/test-rfq`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.logs).toBeInstanceOf(Array);

        // التحقق من أن السجلات غير قابلة للتعديل
        const logEntry = response.body.logs[0];
        if (logEntry) {
            expect(logEntry).toHaveProperty('hash');
            expect(logEntry).toHaveProperty('previousHash');

            // التحقق من blockchain-like integrity
            const calculatedHash = require('crypto')
                .createHash('sha256')
                .update(JSON.stringify(logEntry.data) + logEntry.previousHash + logEntry.timestamp)
                .digest('hex');

            expect(logEntry.hash).toBe(calculatedHash);
        }
    });
});
