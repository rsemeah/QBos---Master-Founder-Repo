/** Jest config for monorepo TypeScript tests */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.js"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  moduleNameMapper: {
    "^@/app/(.*)$": "<rootDir>/apps/proof-harness/app/$1",
    "^@/(.*)$": ["<rootDir>/src/$1", "<rootDir>/apps/proof-harness/app/$1"],
    "^@qbos/silent-engine-core$": "<rootDir>/packages/silent-engine/core/src",
    "^@qbos/silent-engine-core/(.*)$":
      "<rootDir>/packages/silent-engine/core/src/$1",
    "^@qbos/truthserum$": "<rootDir>/packages/truthserum/src/index.ts",
    "^@qbos/truthserum/(.*)$": "<rootDir>/packages/truthserum/src/$1",
    "^@qbos/([^/]+)/(.*)$": "<rootDir>/packages/$1/src/$2",
    "^@qbos/([^/]+)$": "<rootDir>/packages/$1/src",
  },
  moduleDirectories: ["node_modules", "packages", "apps", "src"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/build/"],
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
