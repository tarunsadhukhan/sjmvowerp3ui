/** @type {import('jest').Config} */
/**
 * NOTE: This project uses Vitest for testing (see vitest.config.ts).
 * This Jest config exists only for IDE compatibility and legacy purposes.
 * All tests should be run with: pnpm test or npx vitest run
 */
module.exports = {
    testEnvironment: 'jsdom',
    // Ignore ALL test files - this project uses Vitest, not Jest
    testPathIgnorePatterns: [
      '/node_modules/',
      '/.next/',
      // Ignore all test files to prevent Jest extension from running them
      '.*\\.test\\.(ts|tsx|js|jsx)$',
      '.*\\.spec\\.(ts|tsx|js|jsx)$',
      '__tests__',
    ],
    // Effectively disable Jest by matching no files
    testMatch: [],
    transform: {
      '^.+\\.(js|jsx|ts|tsx)$': ['ts-jest', {
        tsconfig: {
          jsx: 'react-jsx',
        },
      }],
    },
    moduleNameMapper: {
      '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
      '^@/(.*)$': '<rootDir>/src/$1',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  };
  