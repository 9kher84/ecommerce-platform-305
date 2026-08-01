const { CapabilityManifest } = require('../../../frontend/src/config/capabilityManifest');

describe('🔒 Phase 3 Stage 1: Capability Contract Verification', () => {
  test('Capabilities defined by Backend API match Frontend Manifest definitions', () => {
    const backendCapabilities = ['SELLER_PLATFORM', 'BUYER_PROCUREMENT'];
    
    backendCapabilities.forEach(cap => {
      expect(CapabilityManifest[cap]).toBeDefined();
      expect(CapabilityManifest[cap].id).toBe(cap);
      expect(CapabilityManifest[cap].workspace).toBeDefined();
    });
  });
});
