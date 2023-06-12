"use client"
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

interface Props {
    children: JSX.Element
}

export const ClientWrapper = ({ children }: Props) => {
    return <LocalizationProvider dateAdapter={AdapterDayjs}>
        {children}
    </LocalizationProvider>
}

export default ClientWrapper