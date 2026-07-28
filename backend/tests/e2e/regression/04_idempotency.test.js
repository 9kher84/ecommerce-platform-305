const { createIsolatedUser, createRequest, publishRequest, submitProposal, acceptProposal, checkoutAwards } = require('../helpers/factories');
const { cleanIsolatedData } = require('../helpers/db');
const { assertNoDuplicateAwards } = require('../helpers/assertions');
const { WorkPackage, EventLog } = require('../../../sequelize_setup');

describe('Regression - 04 Idempotency', () => {
  let buyer, seller;
  let requestId, workPackageId, processId;

  beforeAll(async () => {
    buyer = await createIsolatedUser('buyer', 'jest_idem');
    seller = await createIsolatedUser('seller', 'jest_idem');
  });

  afterAll(async () => {
    await cleanIsolatedData('jest_idem');
  });

  it('Publish twice should not create duplicate WorkPackages', async () => {
    const reqRes = await createRequest(buyer.token);
    requestId = reqRes.request.id;

    // Publish twice concurrently or sequentially
    await publishRequest(buyer.token, requestId);
    
    // We expect the second publish to either succeed benignly or throw 400 depending on the design.
    // If it succeeds or fails benignly, it shouldn't duplicate.
    try {
      await publishRequest(buyer.token, requestId);
    } catch (e) {
      // It's acceptable for it to throw a "Already published" error.
    }
    
    await new Promise(r => setTimeout(r, 3000));
    
    const wps = await WorkPackage.findAll({ where: { purchaseRequestId: requestId } });
    expect(wps.length).toBe(1);
    workPackageId = wps[0].id;
  }, 10000);

  it('Accept twice should not create duplicate awards or event logs', async () => {
    const propRes = await submitProposal(seller.token, workPackageId, 50000);
    processId = propRes.data.process?.id || propRes.data.processId || propRes.data.id;

    await acceptProposal(buyer.token, processId);
    
    try {
      await acceptProposal(buyer.token, processId);
    } catch (e) {
      // Expected to fail with "not in waiting_buyer state"
    }

    await new Promise(r => setTimeout(r, 1000));

    const events = await EventLog.findAll({ 
      where: { entityId: processId, actionType: 'NEGOTIATION_ACCEPTED' } 
    });
    expect(events.length).toBe(1);
  }, 10000);

  it('Checkout twice should not create duplicate dummy quotations', async () => {
    await checkoutAwards(buyer.token, [processId]);
    
    try {
      await checkoutAwards(buyer.token, [processId]);
    } catch (e) {
      // Expected to fail with "not in pending_award state"
    }

    await assertNoDuplicateAwards(processId);
  }, 10000);
});
