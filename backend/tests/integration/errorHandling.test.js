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

describe('Error Handling', () => {
    beforeAll(async () => {
        if (app.startServer) {
            await app.startServer(false);
        }
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe('404 Not Found', () => {
        it('should return 404 for non-existent route', async () => {
            const res = await request(app)
                .get('/api/nonexistent');

            expect(res.statusCode).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toBeDefined();
            expect(res.body.error.code).toBe('NOT_FOUND');
        });
    });

    describe('401 Unauthorized', () => {
        it('should return 401 for protected route without auth', async () => {
            const res = await request(app)
                .get('/api/auth/me');

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });
    });

    describe('400 Validation Error', () => {
        it('should return 400 for invalid login credentials', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid-email',
                    password: '123'
                });

            expect(res.statusCode).toBeGreaterThanOrEqual(400);
            expect(res.body.success).toBe(false);
        });
    });

    describe('Error Response Structure', () => {
        it('should have consistent error response structure', async () => {
            const res = await request(app)
                .get('/api/nonexistent');

            expect(res.body).toHaveProperty('success');
            expect(res.body).toHaveProperty('error');
            expect(res.body.error).toHaveProperty('code');
            expect(res.body.error).toHaveProperty('message');
            expect(res.body.success).toBe(false);
        });
    });
});
