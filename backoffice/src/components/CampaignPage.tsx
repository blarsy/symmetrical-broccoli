"use client"
import ClientWrapper from "@/components/scaffold/ClientWrapper"
import ExplainCampaign from "@/components/user/ExplainCampaign"
import { Stack } from "@mui/material"

const CampaignPage = () => {

    return <ClientWrapper>
        <Stack sx={{ overflow: 'auto' }}>
            <ExplainCampaign fullscreen />
        </Stack>
    </ClientWrapper>
}

export default CampaignPage