import Pin from '@/app/img/PIN.svg'
import { primaryColor } from "@/utils"
import { Typography, IconButton } from '@mui/material'
import { Stack } from '@mui/system'
import { useContext } from 'react'
import { UiContext } from '../scaffold/UiContextProvider'

const NoLocation = (p: { onLocationSetRequested: () => void }) => {
    const uiContext = useContext(UiContext)
    return <Stack sx={{ maxWidth: '15rem' }}>
        <Typography variant="body1" textAlign="center">{uiContext.i18n.translator('noLocationSet')}</Typography>
        <IconButton onClick={p.onLocationSetRequested}>
            <Pin fill={ primaryColor } width="5rem" height="5rem" />
        </IconButton>
    </Stack>
}

export default NoLocation