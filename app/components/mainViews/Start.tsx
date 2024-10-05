import { ReactNode, useContext, useEffect, useState } from "react"
import React from "react"
import i18n from '@/i18n'
import Splash from "./Splash"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { getTheme, useCustomFonts, versionChecker } from "@/lib/utils"
import { ApolloClient, ApolloProvider, NormalizedCacheObject, gql, useLazyQuery } from "@apollo/client"
import { ErrorSnackbar, SuccessSnackbar } from "../OperationFeedback"
import UpdateApp from "../UpdateApp"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import secureStore, { ISecureStore } from "@/lib/secureStore"
import { Provider } from "react-native-paper"

export const GET_MINIMUM_CLIENT_VERSION = gql`query GetMinimumClientVersion {
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

interface Props {
    overrideSecureStore?: ISecureStore
    overrideVersionChecker?: (serverVersion: string) => boolean
    clientGetter?: (token: string) => ApolloClient<NormalizedCacheObject>
    children: ReactNode
    splashScreenMinimumDuration: number
}

export const StartApolloWrapped = ({ overrideSecureStore, overrideVersionChecker, clientGetter, children, splashScreenMinimumDuration }: Props) => {
    const { t } = i18n
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const [startingUp, setStartingUp] = useState(true)
    const { checkingVersion, outdated } = useVersionCheck(overrideVersionChecker || versionChecker)
    const [fontsLoaded, fontError] = useCustomFonts()
    const { tryRestoreToken } = useUserConnectionFunctions(overrideSecureStore || secureStore, clientGetter)
    
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
        return <Splash />
    }

    if(outdated) {
        return <UpdateApp />
    }

    if(fontsLoaded) {
        return <GestureHandlerRootView style={{ flex: 1 }}>
            { children }
            <ErrorSnackbar testID="startupError" error={appContext.lastNotification?.error} 
                message={(appContext.lastNotification && appContext.lastNotification.error) ? appContext.lastNotification.message || t('requestError') : undefined} 
                onDismissError={() => appDispatch({ type: AppReducerActionType.ClearNotification, payload: undefined  })} />
            <SuccessSnackbar testID="startupSuccess" 
                message={(appContext.lastNotification && !appContext.lastNotification.error) ? appContext.lastNotification.message : undefined} 
                onDismissSuccess={() => appDispatch({ type: AppReducerActionType.ClearNotification, payload: undefined  })} />
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