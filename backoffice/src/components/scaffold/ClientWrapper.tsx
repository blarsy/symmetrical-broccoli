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

dayjs.extend(relativeTime)

interface Props {
    children: JSX.Element
    version?: string
}

const getNavigatorLanguage = () => {
    navigator.languages.forEach(lang => {
        if(['fr', 'en'].includes(lang)) return lang
    })

    return 'fr'
}


const Translatable = ({ children }: { children: JSX.Element }) => {
    const appDispatcher = useContext(AppDispatchContext)
    const appContext = useContext(AppContext)
    const [theme, setTheme] = useState(undefined as Theme | undefined)
    const dark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true })

    const load = async () => {
        const token = localStorage.getItem('token')
        let uiLanguage = localStorage.getItem('lang')
        if(!token) {
            if(!uiLanguage) {
                uiLanguage = getNavigatorLanguage()
                localStorage.setItem('lang', uiLanguage)
            }
            const translator = await i18n(uiLanguage)
            appDispatcher({ type: AppReducerActionType.Load, payload: { i18n: { translator, lang: uiLanguage } }})
        } else {
            //load account and set uiLanguage with the account's language
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

export const ClientWrapper = ({ children, version }: Props) => {
    return <ApolloProvider client={getApolloClient(version)}>
        <AppContextProvider>
            <Translatable>
                { children }
            </Translatable>
        </AppContextProvider>
    </ApolloProvider>
}

export default ClientWrapper