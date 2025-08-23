/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    transform: {
      '^.+\\.(ts|tsx)$': ['ts-jest', { useESM: true }],
    },
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    roots: ['<rootDir>/src', '<rootDir>/__tests__'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    clearMocks: true,
  };
  