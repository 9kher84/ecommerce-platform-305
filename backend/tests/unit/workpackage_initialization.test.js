const WorkPackageCreationPolicy = require('../../src/modules/sales/application/policies/WorkPackageCreationPolicy');
const RequestPublishedEvent = require('../../src/modules/procurement/domain/events/RequestPublishedEvent');
const { WorkPackage, PurchaseRequest, PurchaseRequestItem, User, sequelize } = require('../../sequelize_setup');
const { v4: uuidv4 } = require('uuid');

describe('Finding #1 Fix - WorkPackage Initialization & Idempotency', () => {
  let buyer;

  beforeAll(async () => {
    // Create isolated test buyer user
    buyer = await User.create({
      id: uuidv4(),
      email: `test_buyer_${Date.now()}@example.com`,
      passwordHash: 'hashed_password',
      role: 'buyer',
      name: 'Test Buyer'
    });
  });

  afterAll(async () => {
    if (buyer) {
      await User.destroy({ where: { id: buyer.id } });
    }
  });

  it('1. Single-item RFQ: Should create default WorkPackage on publish event', async () => {
    const requestId = uuidv4();
    const pr = await PurchaseRequest.create({
      id: requestId,
      userId: buyer.id,
      title: 'Single Item RFQ Test',
      description: 'Single item test description',
      status: 'published'
    });

    await PurchaseRequestItem.create({
      id: uuidv4(),
      purchaseRequestId: requestId,
      lineNumber: 1,
      quantity: 100,
      unit: 'وحدة',
      freeTextDescription: 'Item 1'
    });

    const event = new RequestPublishedEvent({
      aggregate: { id: requestId, userId: buyer.id, title: pr.title, description: pr.description, status: 'published', version: 1 }
    });

    // Execute policy
    await WorkPackageCreationPolicy(event);

    // Verify WorkPackage created
    const wps = await WorkPackage.findAll({ where: { purchaseRequestId: requestId } });
    expect(wps.length).toBe(1);
    expect(wps[0].name).toBe('Single Item RFQ Test');
    expect(wps[0].status).toBe('open');

    // Clean up
    await PurchaseRequestItem.destroy({ where: { purchaseRequestId: requestId } });
    await WorkPackage.destroy({ where: { purchaseRequestId: requestId } });
    await PurchaseRequest.destroy({ where: { id: requestId } });
  });

  it('2. Multi-item RFQ: Should create single WorkPackage covering multi-item RFQ without error', async () => {
    const requestId = uuidv4();
    const pr = await PurchaseRequest.create({
      id: requestId,
      userId: buyer.id,
      title: 'Multi Item RFQ Test',
      description: 'Multi item test description',
      status: 'published'
    });

    await PurchaseRequestItem.bulkCreate([
      { id: uuidv4(), purchaseRequestId: requestId, lineNumber: 1, quantity: 50, unit: 'طن' },
      { id: uuidv4(), purchaseRequestId: requestId, lineNumber: 2, quantity: 200, unit: 'كيس' }
    ]);

    const event = new RequestPublishedEvent({
      aggregate: { id: requestId, userId: buyer.id, title: pr.title, description: pr.description, status: 'published', version: 1 }
    });

    await WorkPackageCreationPolicy(event);

    const wps = await WorkPackage.findAll({ where: { purchaseRequestId: requestId } });
    expect(wps.length).toBe(1);
    expect(wps[0].name).toBe('Multi Item RFQ Test');

    // Clean up
    await PurchaseRequestItem.destroy({ where: { purchaseRequestId: requestId } });
    await WorkPackage.destroy({ where: { purchaseRequestId: requestId } });
    await PurchaseRequest.destroy({ where: { id: requestId } });
  });

  it('3. Idempotency & Republish: Should NOT duplicate WorkPackage when policy is executed multiple times', async () => {
    const requestId = uuidv4();
    const pr = await PurchaseRequest.create({
      id: requestId,
      userId: buyer.id,
      title: 'Idempotency Test RFQ',
      description: 'Idempotency test description',
      status: 'published'
    });

    const event = new RequestPublishedEvent({
      aggregate: { id: requestId, userId: buyer.id, title: pr.title, description: pr.description, status: 'published', version: 1 }
    });

    // Execute policy 3 times sequentially
    await WorkPackageCreationPolicy(event);
    await WorkPackageCreationPolicy(event);
    await WorkPackageCreationPolicy(event);

    const wps = await WorkPackage.findAll({ where: { purchaseRequestId: requestId } });
    expect(wps.length).toBe(1);

    // Clean up
    await WorkPackage.destroy({ where: { purchaseRequestId: requestId } });
    await PurchaseRequest.destroy({ where: { id: requestId } });
  });

  it('4. Existing WorkPackage Preservation: Should NOT destroy or duplicate pre-existing manual WorkPackage', async () => {
    const requestId = uuidv4();
    const pr = await PurchaseRequest.create({
      id: requestId,
      userId: buyer.id,
      title: 'Pre-existing WP Test',
      description: 'Pre-existing WP description',
      status: 'published'
    });

    // Manually create existing WorkPackage
    const existingWp = await WorkPackage.create({
      id: uuidv4(),
      purchaseRequestId: requestId,
      name: 'Custom Pre-existing Package',
      description: 'Pre-existing manual package description',
      status: 'open'
    });

    const event = new RequestPublishedEvent({
      aggregate: { id: requestId, userId: buyer.id, title: pr.title, description: pr.description, status: 'published', version: 1 }
    });

    await WorkPackageCreationPolicy(event);

    const wps = await WorkPackage.findAll({ where: { purchaseRequestId: requestId } });
    expect(wps.length).toBe(1);
    expect(wps[0].id).toBe(existingWp.id);
    expect(wps[0].name).toBe('Custom Pre-existing Package');

    // Clean up
    await WorkPackage.destroy({ where: { purchaseRequestId: requestId } });
    await PurchaseRequest.destroy({ where: { id: requestId } });
  });
});
