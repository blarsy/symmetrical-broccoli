import { useContext, useEffect, useState } from "react"
import Main from "./Main"
import React from "react"
import i18n from '@/i18n'
import Splash from "./Splash"
import { useFonts } from 'expo-font'
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { getAuthenticatedApolloClient, versionChecker } from "@/lib/utils"
import { ApolloProvider, gql, useLazyQuery } from "@apollo/client"
import { ErrorSnackbar, SuccessSnackbar } from "../OperationFeedback"
import UpdateApp from "../UpdateApp"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"

const GET_MINIMUM_CLIENT_VERSION = gql`query GetMinimumClientVersion {
    getMinimumClientVersion
}`

const useVersionCheck = (versionChecker: (serverVersion: string) => boolean) => {
    const appDispatch = useContext(AppDispatchContext)
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
            appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: e as Error } })
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
    const appDispatch = useContext(AppDispatchContext)
    const [startingUp, setStartingUp] = useState(true)
    const { checkingVersion, outdated } = useVersionCheck(versionChecker)
    const [fontsLoaded, fontError] = useFonts({
        'DK-magical-brush': require('@/assets/fonts/dk-magical-brush.otf'),
        'Futura-std-heavy': require('@/assets/fonts/futura-std-heavy.otf')
    })
    const { tryRestoreToken } = useUserConnectionFunctions()
    
    const load = async () => {
        try {
            await tryRestoreToken()
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
        return <UpdateApp />
    }

    if(fontsLoaded) {
        return <GestureHandlerRootView style={{ flex: 1 }}>
            <Main />
            <ErrorSnackbar error={appContext.lastNotification?.error} message={(appContext.lastNotification && appContext.lastNotification.error) ? appContext.lastNotification.message || t('requestError') : undefined} onDismissError={() => appDispatch({ type: AppReducerActionType.ClearNotification, payload: undefined  })} />
            <SuccessSnackbar message={(appContext.lastNotification && !appContext.lastNotification.error) ? appContext.lastNotification.message : undefined} onDismissSuccess={() => appDispatch({ type: AppReducerActionType.ClearNotification, payload: undefined  })} />
        </GestureHandlerRootView>
    } else {
        <ErrorSnackbar error={fontError || undefined} message={fontError ? t('requestError') : undefined} onDismissError={() => {}} />
    }
}

export default () => {
    const appContext = useContext(AppContext)
    return <ApolloProvider client={getAuthenticatedApolloClient(appContext.token)}>
        <ApolloWrapped />
    </ApolloProvider>
}
