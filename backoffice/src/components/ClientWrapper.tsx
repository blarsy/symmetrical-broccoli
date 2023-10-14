"use client"
import theme from '@/theme'
import { ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/fr'
import AppContextProvider from './AppContextProvider'
import relativeTime from 'dayjs/plugin/relativeTime'
import dayjs from 'dayjs'

dayjs.extend(relativeTime)

interface Props {
    children: JSX.Element
}

export const ClientWrapper = ({ children }: Props) => {
    return <AppContextProvider>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
            <ThemeProvider theme={theme}>
                {children}
            </ThemeProvider>
        </LocalizationProvider>
    </AppContextProvider>
}

export default ClientWrapper