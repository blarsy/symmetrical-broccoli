import { Dialog, Stack, Theme, useTheme, useMediaQuery, IconButton } from "@mui/material"
import React from 'react'
import 'keen-slider/keen-slider.min.css'
import Close from '@/app/img/CROSS.svg?react'
import { gql } from "@apollo/client"
import ExplainCampaign from "./ExplainCampaign"
export const SET_ACCOUNT_KNOW_ABOUT_CAMPAIGNS = gql`mutation SetAccountKnowsAboutCampaigns {
  setAccountKnowsAboutCampaigns(input: {}) {
    integer
  }
}`

interface Props {
    visible: boolean
    onClose: () => void
    explainOnly?: boolean
}

const ExplainCampaignDialog = (p: Props) => {
     const theme = useTheme()
    const sm = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))

    return <Dialog open={p.visible} onClose={p.onClose} fullWidth maxWidth="md" fullScreen={sm} 
        PaperProps={{ style: { position: 'relative' } }}>
        <Stack alignItems="flex-end">
            <IconButton onClick={p.onClose}>
                <Close width="25px" fill={theme.palette.primary.contrastText} />
            </IconButton>
        </Stack>
        <ExplainCampaign onClose={p.onClose} explainOnly={p.explainOnly} />
    </Dialog>
}

export default ExplainCampaignDialog