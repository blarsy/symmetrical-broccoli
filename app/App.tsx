import React from 'react'
import AppContextProvider from '@/components/AppContextProvider'
import Start from '@/components/mainViews/Start'
import { AppRegistry } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'

function App() {
  return (
    <AppContextProvider>
      <SafeAreaProvider style={{ flex: 1 }}>
        <Start/>
      </SafeAreaProvider>
    </AppContextProvider>
  )
}

AppRegistry.registerComponent("topela", () => App)

export default App

