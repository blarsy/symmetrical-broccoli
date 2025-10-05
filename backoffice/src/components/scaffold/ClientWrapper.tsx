"use client"
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/fr'
import AppContextProvider, { AppContext, AppDispatchContext, AppReducerActionType } from './AppContextProvider'
import relativeTime from 'dayjs/plugin/relativeTime'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useContext, useEffect } from 'react'
import { ApolloProvider } from '@apollo/client'
import { getApolloClient } from '@/lib/apolloClient'
import i18n from '@/i18n'
import LoadedZone from './LoadedZone'
import { PropsWithVersion } from '@/lib/utils'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { getCommonConfig } from '@/config'
import useAccountFunctions from '@/lib/useAccountFunctions'
import ChatContextProvider from './ChatContextProvider'
import UiContextProvider, { UiContext, UiDispatchContext, UiReducerActionType } from './UiContextProvider'
import Themed from './Themed'

dayjs.extend(relativeTime)
dayjs.extend(utc)

const getNavigatorLanguage = () => {
    navigator.languages.forEach(lang => {
        if(['fr', 'en'].includes(lang)) return lang
    })

    return 'fr'
}

const { googleApiKey } = getCommonConfig()

export const Translatable = ({ children, version }: PropsWithVersion) => {
    const uiContext= useContext(UiContext)
    const uiDispatcher = useContext(UiDispatchContext)

    const load = async () => {
        let uiLanguage = localStorage.getItem('lang')
        const lightMode = localStorage.getItem('lightMode')
        if(!uiLanguage) {
            uiLanguage = getNavigatorLanguage()
            localStorage.setItem('lang', uiLanguage)
        }
        const translator = await i18n(uiLanguage)
        dayjs.locale(uiLanguage)
        
        uiDispatcher({ type: UiReducerActionType.Load, payload: { i18n: { translator, lang: uiLanguage }, version, lightMode: !!lightMode }})
    }

    useEffect(() => {
        load()
    }, [])

    return <LoadedZone loading={uiContext.loading} error={uiContext.error} containerStyle={{ 
            height: '100vh', 
            overflow: 'clip', 
            display: 'flex'
        }}>
        { !uiContext.loading && <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={uiContext.i18n.lang}>
            {children}
        </LocalizationProvider>}
    </LoadedZone>
}

export const ApolloWrapped = ({ children, version }: PropsWithVersion) => {
    const appContext = useContext(AppContext)
    const { connectWithToken, disconnect } = useAccountFunctions(version)
    const uiDispatcher = useContext(UiDispatchContext)
    const appDispatch = useContext(AppDispatchContext)
    const uiContext = useContext(UiContext)

    const load = async () => {
        const token = localStorage.getItem('token')
        
        if(token) {
            try {
                await connectWithToken(token)
            } catch(e) {
                // TODO: handle expired token
                uiDispatcher({ type: UiReducerActionType.Load, payload: { i18n: uiContext.i18n, version, error: e as Error }})
                appDispatch({ type: AppReducerActionType.Load, payload: undefined })
            }
        } else {
            appDispatch({ type: AppReducerActionType.Load, payload: undefined })
        }
    }

    useEffect(() => {
        load()
    }, [])

    return <ApolloProvider client={getApolloClient(version, appContext.token, disconnect)}>
        { children }
    </ApolloProvider>
}

export const ClientWrapper = ({ children, version }: PropsWithVersion) => <AppContextProvider>
    <ChatContextProvider>
        <UiContextProvider>
            <GoogleOAuthProvider clientId={googleApiKey}>
                <Themed>
                    <Translatable version={version}>
                        <ApolloWrapped version={version}>
                            { children }
                        </ApolloWrapped>
                    </Translatable>
                </Themed>
            </GoogleOAuthProvider>
        </UiContextProvider>
    </ChatContextProvider>
</AppContextProvider>

export default ClientWrapper