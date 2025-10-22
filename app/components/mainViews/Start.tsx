import { ReactNode, useContext, useEffect, useState } from "react"
import React from "react"
import i18n from '@/i18n'
import Splash from "./Splash"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { getTheme, useCustomFonts, versionChecker } from "@/lib/utils"
import { ApolloClient, ApolloProvider, NormalizedCacheObject, gql, useLazyQuery } from "@apollo/client"
import { ErrorSnackbar, SuccessSnackbar } from "../OperationFeedback"
import UpdateApp from "../UpdateApp"
import { AppAlertContext, AppAlertDispatchContext, AppAlertReducerActionType, AppContext } from "../AppContextProvider"
import useUserConnectionFunctions, { setOverrides } from "@/lib/useUserConnectionFunctions"
import { ISecureStore } from "@/lib/secureStore"
import { Provider } from "react-native-paper"

export const GET_MINIMUM_CLIENT_VERSION = gql`query GetMinimumClientVersion {
    getMinimumClientVersion
}`

const useVersionCheck = (versionChecker: (serverVersion: string) => boolean) => {
    const appAlertDispatch = useContext(AppAlertDispatchContext)
    const [getMinimumClientVersion] = useLazyQuery(GET_MINIMUM_CLIENT_VERSION)
    const [busy, setBusy] = useState(true)
    const [outdated, setOutdated] = useState(false)

    const checkVersion = async (): Promise<void> => {
        try {
            const minimumClientVersionData = await getMinimumClientVersion()
            if(minimumClientVersionData.error) throw minimumClientVersionData.error
            if(!versionChecker(minimumClientVersionData.data.getMinimumClientVersion)) {
                setOutdated(true)
            }
        } catch(e) {
            appAlertDispatch({ type: AppAlertReducerActionType.DisplayNotification, payload: { error: e as Error } })
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

interface Props {
    overrideSecureStore?: ISecureStore
    overrideVersionChecker?: (serverVersion: string) => boolean
    clientGetter?: (token: string) => ApolloClient<NormalizedCacheObject>
    children: ReactNode
    splashScreenMinimumDuration: number
}

export const StartApolloWrapped = ({ overrideSecureStore, overrideVersionChecker, clientGetter, children, splashScreenMinimumDuration }: Props) => {
    const { t } = i18n
    const appAlertContext = useContext(AppAlertContext)
    const appAlertDispatch = useContext(AppAlertDispatchContext)
    const [startingUp, setStartingUp] = useState(true)
    const { checkingVersion, outdated } = useVersionCheck(overrideVersionChecker || versionChecker)
    const [fontsLoaded, fontError] = useCustomFonts()

    setOverrides({ clientGetter, secureStore: overrideSecureStore })

    const { tryRestoreToken } = useUserConnectionFunctions()
    
    const load = async () => {
        try {
            await Promise.all([tryRestoreToken(), new Promise(resolve => setTimeout(resolve, splashScreenMinimumDuration)) ])
         } finally {
            setStartingUp(false)
         }
    }

    useEffect(() => {
        load()
    }, [])

    if(startingUp || !fontsLoaded || checkingVersion) {
        return <Splash testID="Splash" />
    }

    if(outdated) {
        return <UpdateApp />
    }

    if(fontsLoaded) {
        return <GestureHandlerRootView testID="Start" style={{ flex: 1 }}>
            { children }
            <ErrorSnackbar testID="startupError" error={appAlertContext.error} 
                message={appAlertContext.error ? appAlertContext.message || t('requestError') : undefined} 
                onDismissError={() => appAlertDispatch({ type: AppAlertReducerActionType.ClearNotification, payload: {}  })} />
            <SuccessSnackbar testID="startupSuccess" 
                message={!appAlertContext.error ? appAlertContext.message : undefined} 
                onDismissSuccess={() => appAlertDispatch({ type: AppAlertReducerActionType.ClearNotification, payload: {} })} />
        </GestureHandlerRootView>
    } else {
        <ErrorSnackbar testID="fontLoadError" error={fontError || undefined} message={fontError ? t('requestError') : undefined} onDismissError={() => {}} />
    }
}
const theme = getTheme()

export default (p: Props) => {
    const appContext = useContext(AppContext)

    return <ApolloProvider client={appContext.apolloClient!}>
        <Provider theme={theme}>
            <StartApolloWrapped {...p}/>
        </Provider>
    </ApolloProvider>
}