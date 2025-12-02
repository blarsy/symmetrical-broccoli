import ViewAccountPage from "@/components/user/ViewAccountPage"
import { initTranslations } from "@/i18n"
import { GET_ACCOUNT_PUBLIC_INFO, getApolloClient } from "@/lib/apolloClient"
import { urlFromPublicId } from "@/lib/images"

import type { Metadata, ResolvingMetadata } from 'next'
 
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

        const client = getApolloClient(version)
        const res = await client.query({ query: GET_ACCOUNT_PUBLIC_INFO, variables: { id: Number.parseInt(id) } })
        const tPromise = initTranslations(res.data.getAccountPublicInfo.language)

        const images: { url: string }[] = []
        if(res.data.getAccountPublicInfo.imageByAvatarImageId) {
            images.push({ url: urlFromPublicId(res.data.getAccountPublicInfo.imageByAvatarImageId.publicId) })
        }
        if(res.data.getAccountPublicInfo.resourcesByAccountId.nodes.length > 0) {
            res.data.getAccountPublicInfo.resourcesByAccountId.nodes.forEach((resData : any) => {
                resData.resourcesImagesByResourceId.nodes.forEach((imgData: any) => {
                    images.push({ url: urlFromPublicId(imgData.imageByImageId.publicId) })
                })
            })
        }

        const t = await tPromise
        const description = res.data.getAccountPublicInfo.name + t('isOnTopeLa')
        
        return {
            title: res.data.getAccountPublicInfo.name,
            description,
            openGraph: {
                title: res.data.getAccountPublicInfo.name,
                description,
                images
            }
        }
    } catch (e) {
        console.log('Unexpected error while generating metadata', e)
        throw e
    }
}

const Page = async () => <ViewAccountPage />

export default Page
