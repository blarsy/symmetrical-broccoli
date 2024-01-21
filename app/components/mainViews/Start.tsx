import { useContext, useEffect, useState } from "react"
import Login from "./Login"
import Main from "./Main"
import { AppContext } from "@/components/AppContextProvider"
import React from "react"
import i18n from '@/i18n'
import Splash from "./Splash"
import { useFonts } from 'expo-font'
import { ActivityIndicator, Modal, PaperProvider, Portal, Snackbar, Text, configureFonts } from 'react-native-paper'
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { aboveMdWidth, getAuthenticatedApolloClient } from "@/lib/utils"
import { ApolloProvider } from "@apollo/client"

export let fontSizeLarge = 20
export let fontSizeMedium = 16
export let fontSizeSmall = 14

export default () => {
    const { t } = i18n
    const appContext = useContext(AppContext)
    const [restoringSession, setRestoringSession] = useState(true)

    const [fontsLoaded, fontError] = useFonts({
        'DK-magical-brush': require('@/assets/fonts/dk-magical-brush.otf'),
        'Futura-std-heavy': require('@/assets/fonts/futura-std-heavy.otf')
      })
    
    const load = async () => {
        try {
            await appContext.actions.tryRestoreToken()
         } finally {
            setRestoringSession(false)
         }
    }

    useEffect(() => {
        load()
        fontSizeLarge =  aboveMdWidth() ? 24 : 20
        fontSizeMedium = aboveMdWidth() ? 20 : 16
        fontSizeSmall = aboveMdWidth() ? 18 : 14
    }, [])

    if(restoringSession || !fontsLoaded) {
        return <Splash />
    }
    if(fontsLoaded) {
        return <ApolloProvider client={getAuthenticatedApolloClient(appContext.state.token)}>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <PaperProvider theme={{
                    fonts: configureFonts({ config: { 
                        bodyLarge: { fontFamily: 'Futura-std-heavy', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2 },
                        bodyMedium: { fontFamily: 'Futura-std-heavy', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2 },
                        bodySmall: { fontFamily: 'Futura-std-heavy', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2},
                        displayLarge: { fontFamily: 'Futura-std-heavy', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2},
                        displayMedium: { fontFamily: 'Futura-std-heavy', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2},
                        displaySmall: { fontFamily: 'Futura-std-heavy', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2},
                        headlineLarge: { fontFamily: 'DK-magical-brush', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2},
                        headlineMedium: { fontFamily: 'DK-magical-brush', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2},
                        headlineSmall: { fontFamily: 'DK-magical-brush', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2},
                        labelLarge: { fontFamily: 'DK-magical-brush', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2},
                        labelMedium: { fontFamily: 'DK-magical-brush', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2},
                        labelSmall: { fontFamily: 'DK-magical-brush', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2},
                        titleLarge: { fontFamily: 'DK-magical-brush', fontSize: fontSizeLarge, lineHeight: fontSizeLarge * 1.2 },
                        titleMedium: { fontFamily: 'DK-magical-brush', fontSize: fontSizeMedium, lineHeight: fontSizeMedium * 1.2 },
                        titleSmall: { fontFamily: 'DK-magical-brush', fontSize: fontSizeSmall, lineHeight: fontSizeSmall * 1.2 }
                    } })
                }}>
                    { appContext.state.token ? 
                        <Main /> :
                        <Login /> }
                    <Portal>
                        <Modal visible={appContext.state.processing} contentContainerStyle={{ shadowOpacity: 0}}>
                            <ActivityIndicator size="large" />
                        </Modal>
                    </Portal>
                </PaperProvider>
            </GestureHandlerRootView>
        </ApolloProvider>
    } else {
        <PaperProvider>
            <Snackbar visible={!!fontError} onDismiss={() => {}}>{fontError && fontError.toString()}</Snackbar>
        </PaperProvider>
    }
}
