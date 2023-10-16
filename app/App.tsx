import React from 'react'
import AppContextProvider from '@/components/AppContextProvider'
import Start from '@/components/mainViews/Start'
import { AppRegistry, Platform, StatusBar } from 'react-native'
import { primaryColor } from './components/layout/constants'
import { en, fr, registerTranslation } from 'react-native-paper-dates'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'
import dayjs from 'dayjs'
import LanguageDetector from 'i18next-browser-languagedetector'
import RNLanguageDetector from '@os-team/i18next-react-native-language-detector'


function App() {
  dayjs.extend(relativeTime)
  const rawLocale = Platform.OS === "web" ? new LanguageDetector().detect() : RNLanguageDetector.detect()
  let locale = 'en'
  if (rawLocale && typeof rawLocale != 'string' && rawLocale.length) {
    locale = locale[0]
  } else {
    locale = rawLocale as string
  }
  dayjs.locale(locale)
  
  registerTranslation('en', en)
  registerTranslation('fr', fr)

  return <AppContextProvider>
      <>
        <StatusBar backgroundColor={primaryColor}/>
        <Start/>
      </>
  </AppContextProvider>
}

AppRegistry.registerComponent("topela", () => App)

export default App

