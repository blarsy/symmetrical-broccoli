"use client"
import ClientWrapper from "@/components/scaffold/ClientWrapper"
import ExplainCampaign from "@/components/user/ExplainCampaign"
import { usePagePath } from "@/lib/usePagePath"
import { Stack } from "@mui/system"

const CampaignPage = () => {
    const { version } = usePagePath()

    return <ClientWrapper version={version}>
        <Stack sx={{ overflow: 'auto' }}>
            <ExplainCampaign />
        </Stack>
    </ClientWrapper>
}

export default CampaignPage