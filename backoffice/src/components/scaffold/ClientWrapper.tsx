"use client"
import createTheme from '@/theme'
import {  CssBaseline, ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/fr'
import AppContextProvider, { AppContext, AppDispatchContext, AppReducerActionType } from './AppContextProvider'
import relativeTime from 'dayjs/plugin/relativeTime'
import dayjs from 'dayjs'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useContext, useEffect, useState } from 'react'
import { Theme } from '@emotion/react'
import { ApolloProvider } from '@apollo/client'
import { getApolloClient } from '@/lib/apolloClient'
import i18n from '@/i18n'
import LoadedZone from './LoadedZone'
import { PropsWithVersion } from '@/lib/utils'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { getCommonConfig } from '@/config'
import useAccountFunctions from '@/lib/useAccountFunctions'

dayjs.extend(relativeTime)

const getNavigatorLanguage = () => {
    navigator.languages.forEach(lang => {
        if(['fr', 'en'].includes(lang)) return lang
    })

    return 'fr'
}

const { googleApiKey } = getCommonConfig()

const Translatable = ({ children, version }: PropsWithVersion) => {
    const appDispatcher = useContext(AppDispatchContext)
    const appContext = useContext(AppContext)
    const [theme, setTheme] = useState(undefined as Theme | undefined)
    const dark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true })
    const { restoreSession } = useAccountFunctions(version)

    const load = async () => {
        const token = localStorage.getItem('token')
        let uiLanguage = localStorage.getItem('lang')
        if(!uiLanguage) {
            uiLanguage = getNavigatorLanguage()
            localStorage.setItem('lang', uiLanguage)
        }
        const translator = await i18n(uiLanguage)

        if(!token) {
            appDispatcher({ type: AppReducerActionType.Load, payload: { i18n: { translator, lang: uiLanguage }, version }})
        } else {
            try {
                await restoreSession(token, { i18n: { translator, lang: uiLanguage }, version })
            } catch(e) {
                // TODO: handle expired token

                appDispatcher({ type: AppReducerActionType.Load, payload: { i18n: { translator, lang: uiLanguage }, version, error: e as Error }})
            }
        }
    }
    useEffect(() => { 
        setTheme(createTheme(dark)) 
    }, [dark])

    useEffect(() => {
        load()
    }, [])

    return <LoadedZone loading={appContext.loading || !theme} error={appContext.error}>
        { !appContext.loading && theme && <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={appContext.i18n.lang}>
            <ThemeProvider theme={theme!}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </LocalizationProvider>}
    </LoadedZone>
}

export const ClientWrapper = ({ children, version }: PropsWithVersion) => {
    return <ApolloProvider client={getApolloClient(version)}>
        <AppContextProvider>
            <GoogleOAuthProvider clientId={googleApiKey}>
                <Translatable version={version}>
                    { children }
                </Translatable>
            </GoogleOAuthProvider>
        </AppContextProvider>
    </ApolloProvider>
}

export default ClientWrapper