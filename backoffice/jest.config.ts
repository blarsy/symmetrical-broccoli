import type { Config } from '@jest/types'
import nextJest from 'next/jest.js'
 
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

const customJestConfig: Config.InitialOptions = {
  //testEnvironment: "jest-environment-jsdom",
  verbose: true,
  testEnvironment: 'jsdom',
  setupFiles: ["<rootDir>/src/tests/setEnvVars.js"],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

const jestConfig = async () => {
  const nextJestConfig = await createJestConfig(customJestConfig)();
  return {
    ...nextJestConfig,
    moduleNameMapper: {
      // Workaround to put our SVG mock first
      "\\.svg$": "<rootDir>/__mocks__/svg.js",
      ...nextJestConfig.moduleNameMapper,
    },
  }
}

export default jestConfig
