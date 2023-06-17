"use client"
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import 'dayjs/locale/fr'

interface Props {
    children: JSX.Element
}

export const ClientWrapper = ({ children }: Props) => {
    return <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="fr">
        {children}
    </LocalizationProvider>
}

export default ClientWrapper