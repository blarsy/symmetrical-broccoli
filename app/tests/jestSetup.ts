import { TextEncoder, TextDecoder } from 'util'
import 'react-native-gesture-handler/jestSetup'

Object.assign(global, { TextDecoder, TextEncoder })

jest.mock('expo-linking'), () => {
  createURL: jest.fn().mockReturnValue('coucou gamin')
}

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// include this section and the NativeAnimatedHelper section for mocking react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock')

  // The mock for `call` immediately calls the callback which is incorrect
  // So we override it with a no-op
  Reanimated.default.call = () => {}

  return Reanimated
})

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper')

jest.setTimeout(25000)