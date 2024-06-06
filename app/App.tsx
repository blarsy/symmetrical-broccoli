import React from 'react'
import AppContextProvider from '@/components/AppContextProvider'
import Start from '@/components/mainViews/Start'
import { AppRegistry, StatusBar } from 'react-native'
import { primaryColor } from './components/layout/constants'
import { en, fr, registerTranslation } from 'react-native-paper-dates'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'
import utc from 'dayjs/plugin/utc'
import dayjs from 'dayjs'
import Constants from 'expo-constants'
import { errorToString, getLanguage } from './lib/utils'
import './lib/logger'
import { error } from './lib/logger'

if(typeof ErrorUtils != 'undefined') {
  // ErrorUtils is not defined on web
  const defaultErrorHandler = ErrorUtils.getGlobalHandler()
  ErrorUtils.setGlobalHandler((err, fatal) => {
    try {
      error({ message: errorToString(err) })
    } catch(e) {
      const wrappedError = new Error(`Error while trying to log global error: \n${errorToString(err)}\nLogging failed with error:\n${errorToString(e as Error)}`)
      defaultErrorHandler(wrappedError, fatal)
    }
  })
}

function App() {
  dayjs.extend(relativeTime)
  dayjs.locale(getLanguage())
  dayjs.extend(utc)
  
  registerTranslation('en', en)
  registerTranslation('fr', fr)

  return <AppContextProvider>
      <>
        <StatusBar backgroundColor={primaryColor}/>
        <Start/>
      </>
  </AppContextProvider>
}

let AppEntryPoint

if (Constants.expoConfig?.extra?.storybookEnabled === "true") {
  AppEntryPoint = require("./.storybook").default;
} else {
  AppRegistry.registerComponent("topela", () => App)
  AppEntryPoint = App
}

export default AppEntryPoint
