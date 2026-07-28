const PurchaseRequestRepositoryPort = require('../application/ports/PurchaseRequestRepositoryPort');

/**
 * ADAPTER: Mock Repository for Wave 2A.5 Architecture Verification
 */
class MockPurchaseRequestRepository extends PurchaseRequestRepositoryPort {
  async findById(id) {
    return { id, status: 'draft', items: [] };
  }

  async save(purchaseRequest) {
    console.log(`[Mock Repo] Saved Purchase Request ${purchaseRequest.id}`);
  }
}

module.exports = MockPurchaseRequestRepository;
