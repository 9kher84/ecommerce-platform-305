const { createIsolatedUser, createRequest, publishRequest } = require('../helpers/factories');
const { cleanIsolatedData } = require('../helpers/db');
const { assertEventLogCreated, assertOutboxEventCreated } = require('../helpers/assertions');
const { WorkPackage, EventLog, OutboxEvent } = require('../../../sequelize_setup');

describe('Regression - 03 Event Integrity', () => {
  let buyer;
  let requestId;

  beforeAll(async () => {
    buyer = await createIsolatedUser('buyer', 'jest_events');
  });

  afterAll(async () => {
    await cleanIsolatedData('jest_events');
  });

  it('should create exactly one WorkPackage and generate Outbox/EventLog when published', async () => {
    // Create Request
    const reqRes = await createRequest(buyer.token);
    requestId = reqRes.request.id;

    // Publish Request
    await publishRequest(buyer.token, requestId);
    
    // Wait for async workers (Outbox relay -> Policy execution)
    await new Promise(r => setTimeout(r, 3000));
    
    // Verify EventLog was created
    await assertEventLogCreated(reqRes.request.id, 'status_transition');

    // Check OutboxEvent
    await assertOutboxEventCreated(requestId, 'RequestPublishedEvent');

    // Check WorkPackage uniqueness (Policy should only execute once)
    const wps = await WorkPackage.findAll({ where: { purchaseRequestId: requestId } });
    expect(wps.length).toBe(1);
  }, 10000);
});
