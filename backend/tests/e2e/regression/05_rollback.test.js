const { createIsolatedUser, createRequest, publishRequest, submitProposal, acceptProposal, checkoutAwards } = require('../helpers/factories');
const { cleanIsolatedData } = require('../helpers/db');
const { CommercialProcess, Award } = require('../../../sequelize_setup');

describe('Regression - 05 Rollback', () => {
  let buyer, seller;
  let processId1;

  beforeAll(async () => {
    buyer = await createIsolatedUser('buyer', 'jest_roll');
    seller = await createIsolatedUser('seller', 'jest_roll');
  });

  afterAll(async () => {
    await cleanIsolatedData('jest_roll');
  });

  it('should rollback transaction if one process in batch fails during checkout', async () => {
    // 1. Create and setup first process
    const reqRes = await createRequest(buyer.token);
    await publishRequest(buyer.token, reqRes.request.id);
    await new Promise(r => setTimeout(r, 3000));
    
    const { WorkPackage } = require('../../../sequelize_setup');
    const wp = await WorkPackage.findOne({ where: { purchaseRequestId: reqRes.request.id } });
    
    const propRes = await submitProposal(seller.token, wp.id, 50000);
    processId1 = propRes.data.process?.id || propRes.data.processId || propRes.data.id;
    await acceptProposal(buyer.token, processId1);

    // 2. We now have 1 valid process ready for checkout.
    // We will pass [validProcessId, 'invalid-uuid'] to checkout endpoint.
    // The second ID will throw an error, triggering a rollback.
    const invalidProcessId = '00000000-0000-0000-0000-000000000000';
    
    let checkoutError = null;
    try {
      await checkoutAwards(buyer.token, [processId1, invalidProcessId]);
    } catch (e) {
      checkoutError = e;
    }

    expect(checkoutError).not.toBeNull();

    // 3. Verify Rollback
    // The first process should STILL be 'pending_award'
    const p1 = await CommercialProcess.findByPk(processId1);
    expect(p1.status).toBe('pending_award');

    // No awards should be created
    const awards = await Award.findAll({ where: { purchaseRequestId: reqRes.request.id } });
    expect(awards.length).toBe(0);
  }, 15000);
});
