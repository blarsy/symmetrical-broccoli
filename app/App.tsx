import React from 'react'
import AppContextProvider from '@/components/AppContextProvider'
import Start from '@/components/mainViews/Start'
import { AppRegistry, StatusBar, View } from 'react-native'
import { primaryColor } from './components/layout/constants'

function App() {
  return <AppContextProvider>
      <>
        <StatusBar backgroundColor={primaryColor}/>
        <Start/>
      </>
  </AppContextProvider>
}

AppRegistry.registerComponent("topela", () => App)

export default App

