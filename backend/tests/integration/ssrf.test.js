const request = require('supertest');

// Mocks
jest.mock('uuid', () => ({
    v4: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9)
}));

jest.mock('ioredis', () => {
    return jest.fn().mockImplementation(() => ({
        on: jest.fn(),
        connect: jest.fn().mockResolvedValue(),
        get: jest.fn().mockResolvedValue(null),
        set: jest.fn().mockResolvedValue('OK'),
        publish: jest.fn(),
        subscribe: jest.fn(),
        quit: jest.fn().mockResolvedValue(),
        disconnect: jest.fn()
    }));
});

const app = require('../../server');
const { sequelize } = require('../../sequelize_setup');

describe('SSRF Protection', () => {
    let sellerCookies;

    beforeAll(async () => {
        if (app.startServer) {
            await app.startServer(false);
        }

        // Login as seller
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'owner@test.com',
                password: '123456'
            });

        sellerCookies = res.headers['set-cookie'];
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('Internal IP Protection', () => {
        it('should BLOCK localhost URLs', async () => {
            const res = await request(app)
                .post('/api/products/upload')
                .set('Cookie', sellerCookies)
                .send({
                    imageUrl: 'http://127.0.0.1:5000/api/health'
                });

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
            expect(res.body.success).toBeFalsy();
        });

        it('should BLOCK 0.0.0.0 URLs', async () => {
            const res = await request(app)
                .post('/api/products/upload')
                .set('Cookie', sellerCookies)
                .send({
                    imageUrl: 'http://0.0.0.0:8080/secret'
                });

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });

        it('should BLOCK localhost domain', async () => {
            const res = await request(app)
                .post('/api/products/upload')
                .set('Cookie', sellerCookies)
                .send({
                    imageUrl: 'http://localhost:3000/admin'
                });

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });
    });

    describe('Private Network Protection', () => {
        it('should BLOCK 192.168.x.x URLs', async () => {
            const res = await request(app)
                .post('/api/products/upload')
                .set('Cookie', sellerCookies)
                .send({
                    imageUrl: 'http://192.168.1.1/secret.jpg'
                });

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });

        it('should BLOCK 10.x.x.x URLs', async () => {
            const res = await request(app)
                .post('/api/products/upload')
                .set('Cookie', sellerCookies)
                .send({
                    imageUrl: 'http://10.0.0.1/internal'
                });

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });

        it('should BLOCK 172.16-31.x.x URLs', async () => {
            const res = await request(app)
                .post('/api/products/upload')
                .set('Cookie', sellerCookies)
                .send({
                    imageUrl: 'http://172.16.0.1/private'
                });

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });
    });

    describe('Link-Local and Special IPs', () => {
        it('should BLOCK 169.254.x.x (link-local)', async () => {
            const res = await request(app)
                .post('/api/products/upload')
                .set('Cookie', sellerCookies)
                .send({
                    imageUrl: 'http://169.254.169.254/metadata'
                });

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });
    });

    describe('External URL Handling', () => {
        it('should ALLOW safe external URLs', async () => {
            const res = await request(app)
                .post('/api/products/upload')
                .set('Cookie', sellerCookies)
                .send({
                    imageUrl: 'https://via.placeholder.com/150'
                });

            // Should either succeed (200) or fail gracefully (not 403)
            expect(res.statusCode).not.toBe(403);

            // If it succeeds, check response structure
            if (res.statusCode === 200) {
                expect(res.body.imageSize).toBeDefined();
            }
        });
    });

    describe('Invalid URL Handling', () => {
        it('should reject malformed URLs', async () => {
            const res = await request(app)
                .post('/api/products/upload')
                .set('Cookie', sellerCookies)
                .send({
                    imageUrl: 'not-a-valid-url'
                });

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });

        it('should reject missing imageUrl', async () => {
            const res = await request(app)
                .post('/api/products/upload')
                .set('Cookie', sellerCookies)
                .send({});

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
        });
    });
});
