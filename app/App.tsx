import React from 'react'
import AppContextProvider from './components/AppContextProvider'
import { Start } from './components/Start'
import { AppRegistry } from 'react-native'

function App() {
  return (
    <AppContextProvider>
        <Start />
    </AppContextProvider>
  )
}

AppRegistry.registerComponent("topela", () => App)

export default App

