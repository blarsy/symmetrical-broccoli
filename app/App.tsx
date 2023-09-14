import React from 'react'
import AppContextProvider from '@/components/AppContextProvider'
import { Start } from '@/components/mainViews/Start'
import { AppRegistry } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

function App() {
  return (
    <AppContextProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Start/>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AppContextProvider>
  )
}

AppRegistry.registerComponent("topela", () => App)

export default App

