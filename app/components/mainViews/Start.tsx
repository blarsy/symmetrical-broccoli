import { useContext, useEffect, useState } from "react"
import Main from "./Main"
import { AppContext } from "@/components/AppContextProvider"
import React from "react"
import i18n from '@/i18n'
import Splash from "./Splash"
import { useFonts } from 'expo-font'
import { ActivityIndicator, Modal, PaperProvider, Portal, configureFonts } from 'react-native-paper'
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { getAuthenticatedApolloClient, getTheme, versionChecker } from "@/lib/utils"
import { ApolloProvider, gql, useLazyQuery } from "@apollo/client"
import { ErrorSnackbar, SuccessSnackbar } from "../OperationFeedback"
import UpdateApp from "../UpdateApp"


const GET_MINIMUM_CLIENT_VERSION = gql`query GetMinimumClientVersion {
    getMinimumClientVersion
}`

const useVersionCheck = (versionChecker: (serverVersion: string) => boolean) => {
    const appContext = useContext(AppContext)
    const [getMinimumClientVersion] = useLazyQuery(GET_MINIMUM_CLIENT_VERSION)
    const [busy, setBusy] = useState(false)
    const [outdated, setOutdated] = useState(false)

    const checkVersion = async (): Promise<void> => {
        try {
            setBusy(true)
            const minimumClientVersionData = await getMinimumClientVersion()
            if(!versionChecker(minimumClientVersionData.data.getMinimumClientVersion)) {
                setOutdated(true)
            }
        } catch(e) {
            appContext.actions.notify({ error: e as Error })
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
        return <PaperProvider theme={getTheme()}>
            <UpdateApp />
        </PaperProvider>
    }

    if(fontsLoaded) {
        return <GestureHandlerRootView style={{ flex: 1 }}>
            <PaperProvider theme={getTheme()}>
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
