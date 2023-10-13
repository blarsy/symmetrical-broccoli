
import { useContext, useEffect } from "react"
import { fromData, fromError } from "@/lib/DataLoadState"
import Login from "./Login"
import Main from "./Main"
import { AppContext } from "@/components/AppContextProvider"
import { registerLoggedOutHandler } from "@/lib/api"
import React from "react"
import i18n from '@/i18n'
import Splash from "./Splash"
import { useFonts } from 'expo-font'
import { PaperProvider, Snackbar, configureFonts } from 'react-native-paper'

export default () => {
    const { t } = i18n
    const appContext = useContext(AppContext)

    const [fontsLoaded, fontError] = useFonts({
        'DK-magical-brush': require('@/assets/fonts/dk-magical-brush.otf'),
        'Futura-std-book': require('@/assets/fonts/futura-std-book.otf'),
        'Futura-std-heavy': require('@/assets/fonts/futura-std-heavy.otf')
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
        return <PaperProvider theme={{
            fonts: configureFonts({ config: { 
                bodyLarge: { fontFamily: 'Futura-std-book'},
                bodyMedium: { fontFamily: 'Futura-std-book'},
                bodySmall: { fontFamily: 'Futura-std-book'},
                displayLarge: { fontFamily: 'Futura-std-book'},
                displayMedium: { fontFamily: 'Futura-std-book'},
                displaySmall: { fontFamily: 'Futura-std-book'},
                headlineLarge: { fontFamily: 'Futura-std-book'},
                headlineMedium: { fontFamily: 'Futura-std-book'},
                headlineSmall: { fontFamily: 'Futura-std-book'},
                labelLarge: { fontFamily: 'Futura-std-book'},
                labelMedium: { fontFamily: 'Futura-std-book'},
                labelSmall: { fontFamily: 'Futura-std-book'},
                titleLarge: { fontFamily: 'DK-magical-brush' },
                titleMedium: { fontFamily: 'DK-magical-brush' },
                titleSmall: { fontFamily: 'DK-magical-brush' }
            } })
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
