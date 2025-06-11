export default {
    "preset": "jest-expo",
    "verbose": true,
    "testEnvironment": "node",
    // "transformIgnorePatterns": [
    //     "/node_modules/@invertase/react-native-apple-authentication/",
    // ],
    "setupFiles": [
        "./tests/jestSetup.ts",
        "./node_modules/@react-native-google-signin/google-signin/jest/build/jest/setup.js"
    ],
    "setupFilesAfterEnv": [
        "./tests/jestSetupAfterEnv.ts"
    ],
    moduleNameMapper: {
        "\\.svg": "<rootDir>/__mocks__/svgMock.js"
    }
    
}