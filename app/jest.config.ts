export default {
    "preset": "jest-expo",
    "verbose": true,
    "testEnvironment": "node",
    "transformIgnorePatterns": [
            'node_modules/(?!(' +
        [
            // React Native ecosystem
            'react-native',
            '@react-native',
            '@react-navigation',
            '@react-native-community',
            'react-native-reanimated',
            'react-native-gesture-handler',
            'react-native-paper',
            'react-native-paper-dates',
            'react-native-google-places-autocomplete',
            'react-native-swiper-flatlist',
            'react-native-geocoding',
            'react-native-webview',
            // Expo ecosystem
            'expo',
            '@expo',
            'expo-application',
            'expo-asset',
            'expo-camera',
            'expo-constants',
            'expo-device',
            'expo-font',
            'expo-linking',
            'expo-image-manipulator',
            'expo-image-picker',
            'expo-localization',
            'expo-modules-core',
            'expo-notifications',
            'expo-router',
            'expo-secure-store',
            'react-native-error-boundary',

            // Apollo / GraphQL
            '@apollo',
            'graphql',

            // i18next + os-team language detector
            'i18next',
            '@os-team',

            // UI and misc utils
            'usehooks-ts',
            'dayjs',
            'compare-versions',
        ].join('|') +
      ')/)',
    ],
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