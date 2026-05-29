// Global test setup
// This file runs once before all test suites

// Set test environment
process.env.NODE_ENV = "test";

// Increase timeout for slow tests
jest.setTimeout(15000);

// Mock console methods to reduce noise (optional)
// global.console = {
//     ...console,
//     log: jest.fn(),
//     debug: jest.fn(),
//     info: jest.fn(),
//     warn: jest.fn(),
// };
