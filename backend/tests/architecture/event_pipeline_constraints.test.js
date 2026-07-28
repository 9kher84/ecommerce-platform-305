const fs = require('fs');
const path = require('path');

function getFilesRecursively(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      getFilesRecursively(filePath, fileList);
    } else if (filePath.endsWith('.js')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

describe('Architecture Constraints: Event-Driven Pipeline', () => {
  const srcDir = path.join(__dirname, '../../src');
  const allFiles = getFilesRecursively(srcDir);

  const refactoredUseCases = [
    'CreateAwardUseCase.js',
    'ConfirmAwardUseCase.js',
    'CreateEscrowUseCase.js',
    'FundEscrowUseCase.js',
    'CreatePaymentUseCase.js'
  ];
  
  const refactoredPolicies = [
    'AwardCreationPolicy.js',
    'EscrowInitializationPolicy.js',
    'PaymentInitializationPolicy.js',
    'FundEscrowPolicy.js'
  ];

  const useCases = allFiles.filter(f => refactoredUseCases.some(rc => f.endsWith(rc)));
  const domains = allFiles.filter(f => f.includes('domain'));
  const policies = allFiles.filter(f => refactoredPolicies.some(rp => f.endsWith(rp)));

  it('No Use Case should import or use EventBus directly', () => {
    for (const file of useCases) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/require\(['"].*EventBus['"]\)/);
      expect(content).not.toMatch(/EventBus\.publish\(/);
    }
  });

  it('Domain layer should not depend on Sequelize', () => {
    for (const file of domains) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/require\(['"]sequelize['"]\)/);
    }
  });

  it('Policies should not use EventBus.publish directly (Should use UseCases)', () => {
    for (const file of policies) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/EventBus\.publish\(/);
    }
  });

  it('All Policies must be wrapped by PolicyExecutionMiddleware', () => {
    for (const file of policies) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatch(/PolicyExecutionMiddleware\.wrap\(/);
    }
  });
});
