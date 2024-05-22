import { useContext, useEffect, useState } from "react"
import Main from "./Main"
import { AppContext } from "@/components/AppContextProvider"
import React from "react"
import i18n from '@/i18n'
import Splash from "./Splash"
import { useFonts } from 'expo-font'
import { ActivityIndicator, Modal, PaperProvider, Portal, configureFonts } from 'react-native-paper'
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { fontSizeLarge, fontSizeMedium, fontSizeSmall, getAuthenticatedApolloClient, versionChecker } from "@/lib/utils"
import { ApolloProvider, gql, useLazyQuery } from "@apollo/client"
import { ErrorSnackbar, SuccessSnackbar } from "../OperationFeedback"
import * as Application from 'expo-application'
import UpdateApp from "../UpdateApp"

export const theme = {
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
}

const GET_MINIMUM_CLIENT_VERSION = gql`query GetMinimumClientVersion {
    getMinimumClientVersion
}`

const useVersionCheck = (versionChecker: (clientVersion: string, serverVersion: string) => boolean) => {
    const appContext = useContext(AppContext)
    const [getMinimumClientVersion] = useLazyQuery(GET_MINIMUM_CLIENT_VERSION)
    const [busy, setBusy] = useState(false)
    const [outdated, setOutdated] = useState(false)

    const checkVersion = async (): Promise<void> => {
        try {
            setBusy(true)
            const minimumClientVersionData = await getMinimumClientVersion()
            if(!versionChecker(Application.nativeApplicationVersion, minimumClientVersionData.data.getMinimumClientVersion)) {
                setOutdated(true)
            }
        } catch(e) {
            appContext.actions.notify({ error: e })
            setOutdated(false)
        } finally {
            setBusy(false)
        }
    }

    useEffect(() => {
        checkVersion()
    }, [])

    return { checkingVersion: busy, outdated }
}

const ApolloWrapped = () => {
    const { t } = i18n
    const appContext = useContext(AppContext)
    const [startingUp, setStartingUp] = useState(true)
    const { checkingVersion, outdated } = useVersionCheck(versionChecker)
    const [fontsLoaded, fontError] = useFonts({
        'DK-magical-brush': require('@/assets/fonts/dk-magical-brush.otf'),
        'Futura-std-heavy': require('@/assets/fonts/futura-std-heavy.otf')
    })
    
    const load = async () => {
        try {
            await appContext.actions.tryRestoreToken()
         } finally {
            setStartingUp(false)
         }
    }

    useEffect(() => {
        load()
    }, [])
    if(startingUp || !fontsLoaded || checkingVersion) {
        return <Splash />
    }

    if(outdated) {
        return <PaperProvider theme={theme}>
            <UpdateApp />
        </PaperProvider>
    }

    if(fontsLoaded) {
        return <GestureHandlerRootView style={{ flex: 1 }}>
            <PaperProvider theme={theme}>
                <Main />
                <Portal>
                    <Modal visible={appContext.state.processing} contentContainerStyle={{ shadowOpacity: 0}}>
                        <ActivityIndicator size="large" />
                    </Modal>
                </Portal>
                <ErrorSnackbar error={appContext.lastNotification?.error} message={(appContext.lastNotification && appContext.lastNotification.error) ? appContext.lastNotification.message || t('requestError') : undefined} onDismissError={() => appContext.actions.resetLastNofication()} />
                <SuccessSnackbar message={(appContext.lastNotification && !appContext.lastNotification.error) ? appContext.lastNotification.message : undefined} onDismissSuccess={() => appContext.actions.resetLastNofication()} />
            </PaperProvider>
        </GestureHandlerRootView>
    } else {
        <PaperProvider>
            <ErrorSnackbar error={fontError || undefined} message={fontError ? t('requestError') : undefined} onDismissError={() => {}} />
        </PaperProvider>
    }
}

export default () => {
    const appContext = useContext(AppContext)
    return <ApolloProvider client={getAuthenticatedApolloClient(appContext.state.token)}>
        <ApolloWrapped />
    </ApolloProvider>
}
