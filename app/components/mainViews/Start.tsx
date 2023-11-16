
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
import { isMdWidth } from "@/lib/settings"

let fontSizeLarge = 20
let fontSizeMedium = 16
let fontSizeSmall = 14

export default () => {
    const { t } = i18n
    const appContext = useContext(AppContext)

    const [fontsLoaded, fontError] = useFonts({
        'DK-magical-brush': require('@/assets/fonts/dk-magical-brush.otf'),
        'Futura-std-book': require('@/assets/fonts/futura-std-book.otf'),
        'Futura-std-heavy': require('@/assets/fonts/futura-std-heavy.otf')
      })
    

    useEffect(() => {
        fontSizeLarge =  isMdWidth() ? 24 : 20
        fontSizeMedium = isMdWidth() ? 20 : 16
        fontSizeSmall = isMdWidth() ? 18 : 14
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
                bodyLarge: { fontFamily: 'Futura-std-book', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2 },
                bodyMedium: { fontFamily: 'Futura-std-book', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2 },
                bodySmall: { fontFamily: 'Futura-std-book', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2},
                displayLarge: { fontFamily: 'Futura-std-book', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2},
                displayMedium: { fontFamily: 'Futura-std-book', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2},
                displaySmall: { fontFamily: 'Futura-std-book', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2},
                headlineLarge: { fontFamily: 'Futura-std-book', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2},
                headlineMedium: { fontFamily: 'Futura-std-book', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2},
                headlineSmall: { fontFamily: 'Futura-std-book', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2},
                labelLarge: { fontFamily: 'Futura-std-book', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2},
                labelMedium: { fontFamily: 'Futura-std-book', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2},
                labelSmall: { fontFamily: 'Futura-std-book', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2},
                titleLarge: { fontFamily: 'DK-magical-brush', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2 },
                titleMedium: { fontFamily: 'DK-magical-brush', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2 },
                titleSmall: { fontFamily: 'DK-magical-brush', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2 }
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
