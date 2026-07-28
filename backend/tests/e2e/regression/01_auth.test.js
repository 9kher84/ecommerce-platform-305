// Native fetch will be used
const { generateTestToken } = require('../helpers/auth');

const baseURL = process.env.BASE_URL || 'http://localhost:5000';

describe('Regression - 01 Auth & RBAC', () => {

  it('should reject requests without token', async () => {
    const res = await globalThis.fetch(`${baseURL}/api/requests`, { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json' } });
    expect(res.status).toBe(401);
  });

  it('should reject requests with invalid token', async () => {
    const res = await globalThis.fetch(`${baseURL}/api/requests`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer invalid_token_123', 'Content-Type': 'application/json' },
      body: '{}'
    });
    expect(res.status).toBe(401);
  });

  it('should reject seller from buyer-only routes', async () => {
    const sellerToken = generateTestToken('00000000-0000-0000-0000-000000000000', 'seller');
    // Creating a request is a buyer-only action
    const res = await globalThis.fetch(`${baseURL}/api/requests`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${sellerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ header: { title: "Test" }, items: [] })
    });
    // Should be 403 Forbidden or 401
    expect([401, 403]).toContain(res.status);
  });

});
