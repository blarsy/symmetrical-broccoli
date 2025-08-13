import {  CssBaseline, Theme, ThemeProvider, useMediaQuery } from '@mui/material'
import { PropsWithChildren, useContext, useEffect, useState } from 'react'
import { UiContext } from './UiContextProvider'
import createTheme from '@/theme'

const Themed = (p: PropsWithChildren) => {
    const [theme, setTheme] = useState(undefined as Theme | undefined)
    const uiContext = useContext(UiContext)
    const defaultDark = useMediaQuery('(prefers-color-scheme: dark)', { noSsr: true })

    useEffect(() => { 
        setTheme(createTheme(uiContext.lightMode === undefined ? defaultDark : !uiContext.lightMode)) 
    }, [defaultDark, uiContext.lightMode])

    if(theme) {
        return <ThemeProvider theme={theme!}>
            <CssBaseline />
            {p.children}
        </ThemeProvider>
    }

    return <></>
}

export default Themed