"use client"
import { getApolloClient } from "@/lib/apolloClient"
import { ApolloProvider } from "@apollo/client"
import { ThemeProvider, useMediaQuery } from "@mui/material"
import createTheme from "@/theme"
import { getCommonConfig } from "@/config"
import Search from "@/components/Search"
const { mainVersion } = getCommonConfig()

const Page = () => {
    const dark = useMediaQuery('(prefers-color-scheme: dark)')
    const theme = createTheme(dark)

    return <ApolloProvider client={getApolloClient(mainVersion)}>
        <ThemeProvider theme={theme}>
            <Search/>
        </ThemeProvider>
    </ApolloProvider>
}

export default Page