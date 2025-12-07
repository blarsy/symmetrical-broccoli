
import CampaignPage from "@/components/CampaignPage"
import { headers } from "next/headers"
import { getApolloClient } from "@/lib/apolloClient"
import { Metadata, ResolvingMetadata } from "next"
import { GET_ACTIVE_CAMPAIGN } from "@/lib/queries"
import { getCommonConfig } from '@/config'

type Props = {
  params: Promise<{ version: string, id: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
    try {
        // read route params
        const { id, version } = await params
        const url = getCommonConfig().link1Url

        const client = getApolloClient(version)
        const res = await client.query({ query: GET_ACTIVE_CAMPAIGN, variables: {} })

        if(!res.data.getActiveCampaign) return {}

        const headersList = await headers()
        const title = `Une campagne sur Tope-là - ${res.data.getActiveCampaign.name}`

        return {
            metadataBase: new URL(url),
            title,
            description: res.data.getActiveCampaign.description,
            openGraph: {
                title,
                description: res.data.getActiveCampaign.description,
                images: [{ url: `${url}/campaign.png` }],
                url: '/'
            }
        }
    } catch (e) {
        //console.log('Unexpected error while generating metadata', e)
        throw e
    }
}

const Page = async () => {
    return <CampaignPage/>
}

export default Page