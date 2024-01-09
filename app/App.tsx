import React from 'react'
import AppContextProvider from '@/components/AppContextProvider'
import Start from '@/components/mainViews/Start'
import { AppRegistry, StatusBar } from 'react-native'
import { primaryColor } from './components/layout/constants'
import { en, fr, registerTranslation } from 'react-native-paper-dates'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/fr'
import dayjs from 'dayjs'
import { getLocale } from './lib/utils'

function App() {
  dayjs.extend(relativeTime)
  dayjs.locale(getLocale())
  
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

