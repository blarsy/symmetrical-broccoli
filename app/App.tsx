import React from 'react'
import AppContextProvider from './components/AppContextProvider'
import { Start } from './components/Start'
import { AppRegistry } from 'react-native'
import { PaperProvider } from 'react-native-paper'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFonts } from 'expo-font'

function App() {
  const [fontsLoaded] = useFonts({
    'DK-magical-brush': require('./assets/fonts/DK Magical Brush.otf'),
    'Futura-std-book': require('./assets/fonts/Futura Std Book.otf'),
    'Futura-std-heavy': require('./assets/fonts/Futura Std Heavy.otf'),
  })

  return (
    <AppContextProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider>
          <Start loading={!fontsLoaded} />
        </PaperProvider>
      </GestureHandlerRootView>
    </AppContextProvider>
  )
}

AppRegistry.registerComponent("topela", () => App)

export default App

