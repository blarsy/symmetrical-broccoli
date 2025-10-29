import { Dialog, Stack, Theme, useTheme, useMediaQuery, IconButton, Card, Typography } from "@mui/material"
import React, { useContext } from 'react'
import 'keen-slider/keen-slider.min.css'
import { UiContext } from "../scaffold/UiContextProvider"
import Close from '@/app/img/CROSS.svg'
import EarningTokens from "../token/EarningTokens"
import { Box } from "@mui/system"

interface Props {
    visible: boolean
    onClose: () => void
}

const SuspensionHelp = (p: Props) => {
    const uiContext = useContext(UiContext)
    const theme = useTheme()
    const sm = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

    return <Dialog open={p.visible} onClose={p.onClose} fullWidth maxWidth="md" fullScreen={sm}>
        <Stack alignItems="flex-end">
            <IconButton onClick={p.onClose}>
                <Close width="25px" fill={theme.palette.primary.contrastText} />
            </IconButton>
        </Stack>
        <Stack sx={{ margin: '0 2rem 2rem 2rem' }}>
            <Typography variant="h3" textAlign="center">{uiContext.i18n.translator('suspensionExplanationDialogTitle')}</Typography>
            <Typography variant="subtitle1">{uiContext.i18n.translator('whySuspended')}</Typography>
            <EarningTokens version={uiContext.version} onSomeTaskClicked={p.onClose}/>
        </Stack>
    </Dialog>
}

export default SuspensionHelp