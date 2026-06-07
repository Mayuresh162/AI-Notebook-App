import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  collectCoverageFrom: [
    "lib/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "!lib/**/*.d.ts",
    "!lib/**/supabase*.ts",
    "!lib/llm.ts",
    "!lib/langchain.ts",
    "!lib/agent.ts",
    "!components/ui/**",
  ],
  coverageReporters: ["text", "lcov", "json-summary"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^next-intl$": "<rootDir>/tests/mocks/next-intl.tsx",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  testMatch: [
    "<rootDir>/tests/unit/**/*.test.ts",
    "<rootDir>/tests/components/**/*.test.tsx",
  ],
};

export default createJestConfig(customJestConfig);
