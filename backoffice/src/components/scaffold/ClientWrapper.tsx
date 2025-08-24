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

const Translatable = ({ children, version }: PropsWithVersion) => {
    const uiDispatcher = useContext(UiDispatchContext)
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const uiContext= useContext(UiContext)
    const { connectWithToken, disconnect } = useAccountFunctions(version)

    const load = async () => {
        const token = localStorage.getItem('token')
        let uiLanguage = localStorage.getItem('lang')
        const lightMode = localStorage.getItem('lightMode')
        if(!uiLanguage) {
            uiLanguage = getNavigatorLanguage()
            localStorage.setItem('lang', uiLanguage)
        }
        const translator = await i18n(uiLanguage)
        dayjs.locale(uiLanguage)

        uiDispatcher({ type: UiReducerActionType.Load, payload: { i18n: { translator, lang: uiLanguage }, version, lightMode: !!lightMode }})

        if(token) {
            try {
                await connectWithToken(token, { i18n: { translator, lang: uiLanguage }, version, lightMode: !!lightMode })
            } catch(e) {
                // TODO: handle expired token
                uiDispatcher({ type: UiReducerActionType.Load, payload: { i18n: { translator, lang: uiLanguage }, version, error: e as Error }})
            }
        } else {
            appDispatch({ type: AppReducerActionType.Load, payload: undefined })
        }
    }

    useEffect(() => {
        load()
    }, [])

    return <LoadedZone loading={uiContext.loading} error={uiContext.error} containerStyle={{ 
            height: '100vh', 
            overflow: 'clip', 
            display: 'flex'
        }}>
        <ApolloProvider client={getApolloClient(version, appContext.token, disconnect)}>
            { !uiContext.loading && <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={uiContext.i18n.lang}>
                <Themed>
                    {children}
                </Themed>
            </LocalizationProvider>}
        </ApolloProvider>
    </LoadedZone>
}

export const ClientWrapper = ({ children, version }: PropsWithVersion) => {
    return <AppContextProvider>
        <ChatContextProvider>
            <UiContextProvider>
                <GoogleOAuthProvider clientId={googleApiKey}>
                    <Translatable version={version}>
                        { children }
                    </Translatable>
                </GoogleOAuthProvider>
            </UiContextProvider>
        </ChatContextProvider>
    </AppContextProvider>
}

export default ClientWrapper