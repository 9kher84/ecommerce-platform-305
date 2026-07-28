const { createIsolatedUser, createRequest, publishRequest, submitProposal, acceptProposal, checkoutAwards } = require('../helpers/factories');
const { cleanIsolatedData } = require('../helpers/db');
const { assertAwardCreated } = require('../helpers/assertions');

describe('E2E Smoke Suite', () => {
  let buyer, seller;
  let workPackageId;
  let processId;

  beforeAll(async () => {
    // We mock the vault and secrets in the helper or setup script, so no vault connection is needed here.
    buyer = await createIsolatedUser('buyer', 'jest_smoke');
    seller = await createIsolatedUser('seller', 'jest_smoke');
  });

  afterAll(async () => {
    await cleanIsolatedData('jest_smoke');
  });

  it('should complete the golden path of V2 Commercial Engine', async () => {
    // 1. Create Request
    const reqRes = await createRequest(buyer.token);
    expect(reqRes.success).toBe(true);
    const requestId = reqRes.request.id;

    // 2. Publish Request
    await publishRequest(buyer.token, requestId);
    
    // Wait for worker to create WorkPackage
    await new Promise(r => setTimeout(r, 3000));
    
    const { WorkPackage } = require('../../../sequelize_setup');
    const wp = await WorkPackage.findOne({ where: { purchaseRequestId: requestId } });
    expect(wp).not.toBeNull();
    workPackageId = wp.id;

    // 3. Submit Proposal
    const propRes = await submitProposal(seller.token, workPackageId, 50000);
    expect(propRes.success).toBe(true);
    processId = propRes.data.process?.id || propRes.data.processId || propRes.data.id;
    expect(processId).toBeDefined();

    // 4. Accept Proposal
    const acceptRes = await acceptProposal(buyer.token, processId);
    expect(acceptRes.success).toBe(true);

    // 5. Checkout
    const checkRes = await checkoutAwards(buyer.token, [processId]);
    expect(checkRes.success).toBe(true);

    // 6. Assertions
    await assertAwardCreated(processId);
  }, 15000); // Increased timeout for this test
});
