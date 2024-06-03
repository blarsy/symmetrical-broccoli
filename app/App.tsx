import React from 'react'
import AppContextProvider from '@/components/AppContextProvider'
import Start, { theme } from '@/components/mainViews/Start'
import { AppRegistry, StatusBar } from 'react-native'
import { primaryColor } from './components/layout/constants'
import { en, fr, registerTranslation } from 'react-native-paper-dates'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'
import dayjs from 'dayjs'
import Constants from 'expo-constants'
import { getLanguage } from './lib/utils'
import './lib/logger'
import { PaperProvider } from 'react-native-paper'


function App() {
  dayjs.extend(relativeTime)
  dayjs.locale(getLanguage())
  
  registerTranslation('en', en)
  registerTranslation('fr', fr)

  return <PaperProvider theme={theme}>
      <AppContextProvider>
        <>
          <StatusBar backgroundColor={primaryColor}/>
          <Start/>
        </>
      </AppContextProvider>
    </ PaperProvider>
}

let AppEntryPoint

if (Constants.expoConfig?.extra?.storybookEnabled === "true") {
  AppEntryPoint = require("./.storybook").default;
} else {
  AppRegistry.registerComponent("topela", () => App)
  AppEntryPoint = App
}

export default AppEntryPoint
