const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    // Map monorepo package imports from tests (must come before @/ catch-all)
    '^@/\\.\\./\\.\\./\\.\\./packages/engines/execution-engine/core/src/(.*)$': '<rootDir>/../../packages/engines/execution-engine/core/src/$1',
    '^@/\\.\\./\\.\\./\\.\\./packages/truthserum/src/(.*)$': '<rootDir>/../../packages/truthserum/src/$1',
    // Map workspace package imports from API routes
    '^@qbos/execution-engine-core$': '<rootDir>/__mocks__/@qbos/execution-engine-core.ts',
    '^@qbos/truthserum$': '<rootDir>/__mocks__/@qbos/truthserum.ts',
    '^@qbos/logger$': '<rootDir>/__mocks__/@qbos/logger.ts',
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@octokit|@supabase|stripe)/)',
  ],
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/_*.{js,jsx,ts,tsx}',
    '!**/.next/**',
    '!**/node_modules/**',
  ],
}

module.exports = createJestConfig(customJestConfig)
