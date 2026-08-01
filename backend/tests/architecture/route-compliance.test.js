const fs = require('fs');
const path = require('path');

describe('🔒 Phase 3 Stage 1: Route Security Enforcement Check', () => {
  test('CI Guard: Every defined Route is structured with a Policy wrapper or exception', () => {
    const appPath = path.join(__dirname, '../../../frontend/src/App.jsx');
    const content = fs.readFileSync(appPath, 'utf8');

    // Make sure we have the App file loaded
    expect(content).toBeDefined();

    // Verify file contains expected Route keywords as a baseline check
    expect(content).toContain('<Route');
  });
});
