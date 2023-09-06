import React from 'react'
import AppContextProvider from './components/AppContextProvider'
import { Start } from './components/Start'
import { AppRegistry } from 'react-native'
import { PaperProvider, Snackbar } from 'react-native-paper'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFonts } from 'expo-font'
import { Font } from 'react-native-paper/lib/typescript/types'

function App() {
  const [fontsLoaded, fontError] = useFonts({
    'DK-magical-brush': require('./assets/fonts/DK Magical Brush.otf'),
    'Futura-std-book': require('./assets/fonts/Futura Std Book.otf'),
    'Futura-std-heavy': require('./assets/fonts/Futura Std Heavy.otf'),
  })
  const defaultFont: Font  = {
    fontFamily: 'Futura-std-book'
  }

  return (
    <AppContextProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PaperProvider theme={{
          fonts: {
            regular: defaultFont, titleLarge: defaultFont, titleMedium: defaultFont, titleSmall: defaultFont,
            bodyLarge: defaultFont, bodyMedium: defaultFont, bodySmall: defaultFont, default: defaultFont,
            labelLarge: defaultFont, labelMedium: defaultFont, labelSmall: defaultFont
          }
        }}>
          <Start loading={!fontsLoaded && !fontError} />
          <Snackbar visible={!!fontError} onDismiss={() => {}}>{fontError && fontError.toString()}</Snackbar>
        </PaperProvider>
      </GestureHandlerRootView>
    </AppContextProvider>
  )
}

AppRegistry.registerComponent("topela", () => App)

export default App

