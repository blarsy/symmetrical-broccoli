export default {
    "preset": "jest-expo",
    "verbose": true,
    "testEnvironment": "node",
    "setupFiles": [
        "./tests/jestSetup.ts",
        "./node_modules/@react-native-google-signin/google-signin/jest/build/jest/setup.js"
    ],
    "setupFilesAfterEnv": [
        "./tests/jestSetupAfterEnv.ts"
    ]
}