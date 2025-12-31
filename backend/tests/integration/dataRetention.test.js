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
const { sequelize, AuditLog } = require('../../sequelize_setup');
const DataRetentionService = require('../../services/dataRetentionService');

describe('Data Retention Policy', () => {
    let oldLogId;
    let newLogId;

    beforeAll(async () => {
        if (app.startServer) {
            await app.startServer(false);
        }
    });

    afterAll(async () => {
        // Clean up test logs
        if (oldLogId) {
            await AuditLog.destroy({ where: { id: oldLogId }, force: true });
        }
        if (newLogId) {
            await AuditLog.destroy({ where: { id: newLogId }, force: true });
        }
        await sequelize.close();
    });

    describe('AuditLog Cleanup', () => {
        it('should create old and new audit logs for testing', async () => {
            const oldDate = new Date();
            oldDate.setDate(oldDate.getDate() - 100); // 100 days old

            const recentDate = new Date(); // Now

            // Create old log
            const oldLog = await AuditLog.create({
                action: 'TEST_RETENTION_OLD',
                userId: null,
                details: { test: true },
                createdAt: oldDate
            });

            oldLogId = oldLog.id;

            // Force update createdAt if Sequelize overwrote it
            await sequelize.query(
                `UPDATE audit_logs SET "createdAt" = :date WHERE id = :id`,
                {
                    replacements: { date: oldDate, id: oldLog.id },
                    type: sequelize.QueryTypes.UPDATE
                }
            );

            // Create new log
            const newLog = await AuditLog.create({
                action: 'TEST_RETENTION_NEW',
                userId: null,
                details: { test: true },
                createdAt: recentDate
            });

            newLogId = newLog.id;

            expect(oldLog).toBeDefined();
            expect(newLog).toBeDefined();
        });

        it('should delete logs older than 90 days', async () => {
            const deletedCount = await DataRetentionService.cleanOldAuditLogs();

            expect(deletedCount).toBeGreaterThanOrEqual(1);
        });

        it('should have deleted the old log', async () => {
            const oldExists = await AuditLog.findByPk(oldLogId);
            expect(oldExists).toBeNull();
        });

        it('should have preserved the recent log', async () => {
            const newExists = await AuditLog.findByPk(newLogId);
            expect(newExists).toBeDefined();
            expect(newExists.action).toBe('TEST_RETENTION_NEW');
        });
    });

    describe('AuditLog Immutability', () => {
        let testLogId;

        beforeAll(async () => {
            const log = await AuditLog.create({
                action: 'TEST_IMMUTABILITY',
                userId: null,
                details: { original: true }
            });
            testLogId = log.id;
        });

        afterAll(async () => {
            if (testLogId) {
                await AuditLog.destroy({ where: { id: testLogId }, force: true });
            }
        });

        it('should prevent updates to audit logs', async () => {
            const log = await AuditLog.findByPk(testLogId);

            await expect(
                log.update({ action: 'MODIFIED_ACTION' })
            ).rejects.toThrow();
        });

        it('should allow deletion with force flag', async () => {
            const log = await AuditLog.create({
                action: 'TEST_DELETE',
                userId: null,
                details: { test: true }
            });

            const deleteId = log.id;

            await AuditLog.destroy({ where: { id: deleteId }, force: true });

            const deleted = await AuditLog.findByPk(deleteId);
            expect(deleted).toBeNull();
        });
    });
});
