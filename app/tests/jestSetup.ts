import { Text } from "react-native"

jest.mock('expo-linking'), () => {
    createURL: jest.fn().mockReturnValue('coucou gamin')
}

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)