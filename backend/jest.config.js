module.exports = {
  testEnvironment: "node",
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "services/**/*.js",
    "middleware/**/*.js",
    "controllers/**/*.js",
    "!**/node_modules/**",
  ],
  testMatch: ["**/tests/**/*.test.js"],
  verbose: true,
  testTimeout: 60000, // SOVEREIGN: 60 seconds minimum
  detectOpenHandles: true,
  forceExit: false, // SOVEREIGN: Must be false
  maxWorkers: 1, // SOVEREIGN: Run tests sequentially
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
};
