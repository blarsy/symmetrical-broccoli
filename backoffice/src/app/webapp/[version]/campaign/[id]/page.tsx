
import CampaignPage from "@/components/CampaignPage"
import { getApolloClient } from "@/lib/apolloClient"
import { Metadata, ResolvingMetadata } from "next"
import { GET_ACTIVE_CAMPAIGN } from "@/lib/queries"
import { getCommonConfig } from '@/config'
import { urlFromPublicId } from "@/lib/images"

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

        const title = `${res.data.getActiveCampaign.name} - Une campagne Tope-là`

        return {
            title,
            description: res.data.getActiveCampaign.summary,
            openGraph: {
                title,
                description: res.data.getActiveCampaign.summary,
                images: [{ url: urlFromPublicId('bullhorn_r3n9ka'), width: 600, height: 600 }]
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