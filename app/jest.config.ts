export default {
    "preset": "jest-expo",
    "verbose": true,
    "setupFiles": [
        "./node_modules/@react-native-google-signin/google-signin/jest/build/jest/setup.js",
        "./tests/jestSetup.ts"
    ],
    "setupFilesAfterEnv": [
        "@testing-library/react-native/extend-expect"
    ]
}