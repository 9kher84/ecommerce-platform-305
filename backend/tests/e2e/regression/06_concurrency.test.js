const { createIsolatedUser, createRequest, publishRequest, submitProposal, acceptProposal } = require('../helpers/factories');
const { cleanIsolatedData } = require('../helpers/db');
const { CommercialProcess, EventLog } = require('../../../sequelize_setup');

describe('Regression - 06 Concurrency', () => {
  let buyer, seller;
  let processId;

  beforeAll(async () => {
    buyer = await createIsolatedUser('buyer', 'jest_conc');
    seller = await createIsolatedUser('seller', 'jest_conc');
  });

  afterAll(async () => {
    await cleanIsolatedData('jest_conc');
  });

  it('should handle concurrent accept requests safely (only one wins)', async () => {
    const reqRes = await createRequest(buyer.token);
    await publishRequest(buyer.token, reqRes.request.id);
    await new Promise(r => setTimeout(r, 3000));
    
    const { WorkPackage } = require('../../../sequelize_setup');
    const wp = await WorkPackage.findOne({ where: { purchaseRequestId: reqRes.request.id } });
    
    const propRes = await submitProposal(seller.token, wp.id, 50000);
    processId = propRes.data.process?.id || propRes.data.processId || propRes.data.id;

    // Send 3 concurrent accept requests
    const promises = [
      acceptProposal(buyer.token, processId).catch(e => e),
      acceptProposal(buyer.token, processId).catch(e => e),
      acceptProposal(buyer.token, processId).catch(e => e)
    ];

    const results = await Promise.all(promises);
    
    // One should succeed, two should fail
    const successes = results.filter(r => r.success === true);
    expect(successes.length).toBe(1);

    // Verify only one EventLog was created
    await new Promise(r => setTimeout(r, 1000));
    const events = await EventLog.findAll({ 
      where: { entityId: processId, actionType: 'NEGOTIATION_ACCEPTED' } 
    });
    expect(events.length).toBe(1);
  }, 15000);
});
