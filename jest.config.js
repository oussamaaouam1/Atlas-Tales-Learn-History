/** App tests (React Native). Convex and script tests run with Vitest (vitest.config.mts). */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}', '<rootDir>/__tests__/**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/convex/', '<rootDir>/scripts/'],
};
