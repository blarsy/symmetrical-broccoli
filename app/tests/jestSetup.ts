import { TextEncoder, TextDecoder } from 'util'
import 'react-native-gesture-handler/jestSetup'
import { enableScreens } from 'react-native-screens'
import React from 'react'

enableScreens(false)

Object.assign(global, { TextDecoder, TextEncoder })

jest.mock('expo-linking', () => {

  return {
    createURL: jest.fn().mockReturnValue('http://coucou.com/gamin'),
    getInitialURL: jest.fn().mockReturnValue('url'),
    addEventListener: jest.fn().mockReturnValue({
      remove: () => {}
    })
  }
})

const WebView = (props: any) => {
  return React.createElement('WebView', props, props.children);
}

jest.mock('react-native-webview', () => ({ 
  __esModule: true,
  default: WebView }))

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
jest.mock('react-native/src/private/animated/NativeAnimatedHelper')

jest.mock('@os-team/i18next-react-native-language-detector', () => ({
  type: 'languageDetector',
  async: true,
  detect: (cb: (lang: string) => void) => cb('en'),
  init: jest.fn(),
  cacheUserLanguage: jest.fn(),
}))

jest.mock('react-native-maps', () => {
  const React = require('react')
  const { View } = require('react-native')
  const MockMapView = (props: any) => React.createElement(View, props, props.children)
  const MockMarker = (props: any) => React.createElement(View, props, props.children)
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    PROVIDER_GOOGLE: 'google',
  }
})

jest.mock('react-native-paper/react-navigation', () => {
  return {
    createMaterialBottomTabNavigator: () => {
      const React = require('react')
      return {
        Navigator: (props: any) => React.createElement('View', props),
        Screen: (props: any) => React.createElement('View', props),
      }
    },
  }
})

jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  
}))

jest.setTimeout(40000)