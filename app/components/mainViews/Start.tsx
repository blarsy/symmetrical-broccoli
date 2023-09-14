import { useContext, useEffect } from "react"
import { fromData, fromError } from "@/lib/DataLoadState"
import Login from "./Login"
import Main from "./Main"
import { AppContext } from "@/components/AppContextProvider"
import { registerLoggedOutHandler } from "@/lib/api"
import React from "react"
import i18n from '@/i18n'
import Splash from "./Splash"
import { Font } from 'react-native-paper/lib/typescript/types'
import { useFonts, isLoaded } from 'expo-font'
import { PaperProvider, Snackbar } from 'react-native-paper'

export const Start = () => {
    const { t } = i18n
    const appContext = useContext(AppContext)

    const [fontsLoaded, fontError] = useFonts({
        'DK-magical-brush': require('@/assets/fonts/dk-magical-brush.otf'),
        'Futura-std-book': require('@/assets/fonts/futura-std-book.otf'),
        'Futura-std-heavy': require('@/assets/fonts/futura-std-heavy.otf'),
        'FontAwesome': require('@/assets/fonts/FontAwesome.ttf'),
        'material': require('@/assets/fonts/MaterialCommunityIcons.ttf')
      })
    

    useEffect(() => {
        const load = async () => {
            try {
                registerLoggedOutHandler(() => {
                    appContext.actions.setTokenState(fromData(''))
                })
                await appContext.actions.tryRestoreToken()
            } catch(e: any) {
                appContext.actions.setTokenState(fromError(e, t('save_error')))
            }
        }
        load()
    }, [])
    if(appContext.state.token.loading || !fontsLoaded) {
        return <Splash />
    }
    if(fontsLoaded) {
        console.log(`isLoaded('Futura-std-book')`, isLoaded('Futura-std-book'))
        const defaultFont: Font  = {
            fontFamily: 'Futura-std-book'
        }
        return <PaperProvider theme={{
            fonts: {
              regular: defaultFont, titleLarge: defaultFont, titleMedium: defaultFont, titleSmall: defaultFont,
              bodyLarge: defaultFont, bodyMedium: defaultFont, bodySmall: defaultFont, default: defaultFont,
              labelLarge: defaultFont, labelMedium: defaultFont, labelSmall: defaultFont
            }
          }}>
            { appContext.state.token.data ? 
                <Main /> :
                <Login /> }
        </PaperProvider>
    } else {
        <PaperProvider>
            <Snackbar visible={!!fontError} onDismiss={() => {}}>{fontError && fontError.toString()}</Snackbar>
        </PaperProvider>
    }
}
