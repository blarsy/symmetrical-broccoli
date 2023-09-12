import React from 'react'
import AppContextProvider from '@/components/AppContextProvider'
import { Start } from '@/components/mainViews/Start'
import { AppRegistry } from 'react-native'
import { PaperProvider, Snackbar } from 'react-native-paper'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFonts } from 'expo-font'
import { Font } from 'react-native-paper/lib/typescript/types'

function App() {
  const [fontsLoaded, fontError] = useFonts({
    'DK-magical-brush': require('./assets/fonts/dk-magical-brush.otf'),
    'Futura-std-book': require('./assets/fonts/futura-std-book.otf'),
    'Futura-std-heavy': require('./assets/fonts/futura-std-heavy.otf'),
    'FontAwesome': require('./assets/fonts/FontAwesome.ttf')
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

