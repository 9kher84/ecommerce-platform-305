const { createIsolatedUser, createRequest, publishRequest, submitProposal, acceptProposal, checkoutAwards } = require('../helpers/factories');
const { cleanIsolatedData } = require('../helpers/db');

describe('Regression - 07 Performance SLA', () => {
  let buyer, seller;
  let workPackageId, processId, requestId;

  beforeAll(async () => {
    buyer = await createIsolatedUser('buyer', 'jest_perf');
    seller = await createIsolatedUser('seller', 'jest_perf');
  });

  afterAll(async () => {
    await cleanIsolatedData('jest_perf');
  });

  // Thresholds
  const thresholds = {
    createRequest: 300,
    publishRequest: 300,
    submitProposal: 300,
    acceptProposal: 300,
    checkout: 500
  };

  const isCI = process.env.CI === 'true';

  function assertSLA(duration, endpoint) {
    const limit = thresholds[endpoint];
    if (isCI) {
      expect(duration).toBeLessThanOrEqual(limit);
    } else {
      if (duration > limit) {
        console.warn(`⚠️ [PERFORMANCE REPORT] ${endpoint} took ${Math.round(duration)}ms (Threshold: ${limit}ms)`);
      } else {
        console.log(`✅ [PERFORMANCE REPORT] ${endpoint} took ${Math.round(duration)}ms (Threshold: ${limit}ms)`);
      }
    }
  }

  it('Performance test for core endpoints', async () => {
    // Create Request
    let start = performance.now();
    const reqRes = await createRequest(buyer.token);
    assertSLA(performance.now() - start, 'createRequest');
    requestId = reqRes.request.id;

    // Publish Request
    start = performance.now();
    await publishRequest(buyer.token, requestId);
    assertSLA(performance.now() - start, 'publishRequest');

    await new Promise(r => setTimeout(r, 3000));
    const { WorkPackage } = require('../../../sequelize_setup');
    const wp = await WorkPackage.findOne({ where: { purchaseRequestId: requestId } });
    workPackageId = wp.id;

    // Submit Proposal
    start = performance.now();
    const propRes = await submitProposal(seller.token, workPackageId, 50000);
    assertSLA(performance.now() - start, 'submitProposal');
    processId = propRes.data.process?.id || propRes.data.processId || propRes.data.id;

    // Accept Proposal
    start = performance.now();
    await acceptProposal(buyer.token, processId);
    assertSLA(performance.now() - start, 'acceptProposal');

    // Checkout
    start = performance.now();
    await checkoutAwards(buyer.token, [processId]);
    assertSLA(performance.now() - start, 'checkout');
  }, 20000);
});
