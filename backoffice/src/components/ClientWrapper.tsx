"use client"
import createTheme from '@/theme'
import { Box, CircularProgress, ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/fr'
import AppContextProvider from './AppContextProvider'
import relativeTime from 'dayjs/plugin/relativeTime'
import dayjs from 'dayjs'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useEffect, useState } from 'react'
import { Theme } from '@emotion/react'
import { ApolloClient, ApolloProvider, InMemoryCache, createHttpLink, from } from '@apollo/client'
import getConfig from '@/config/index'

dayjs.extend(relativeTime)

interface Props {
    children: JSX.Element
    version?: string
}

export const getApolloClient = (version?: string) => {
    const config = getConfig(version)
    const httpLink = createHttpLink({ uri: config.graphqlUrl })

    return new ApolloClient({
      link: from([
        httpLink
      ]),
      cache: new InMemoryCache(),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: 'cache-and-network'
        }
      }
    })
  }

export const ClientWrapper = ({ children, version }: Props) => {
    const [theme, setTheme] = useState(undefined as Theme | undefined)
    const dark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true })
    
    useEffect(() => { setTheme(createTheme(dark)) }, [dark])
    return <ApolloProvider client={getApolloClient(version)}>
        <AppContextProvider>
            <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
                { theme ? <ThemeProvider theme={theme}>
                    {children}
                </ThemeProvider> : <Box display="flex" flexDirection="column" alignItems="center" margin="1rem">
                    <CircularProgress color="primary" />
                </Box>}
            </LocalizationProvider>
        </AppContextProvider>
    </ApolloProvider>
}

export default ClientWrapper