import ViewResourcePage from "@/components/resources/ViewResourcePage"
import { GET_RESOURCE, getApolloClient } from "@/lib/apolloClient"
import { urlFromPublicId } from "@/lib/images"
import { width } from "@mui/system"

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
      const res = await client.query({ query: GET_RESOURCE, variables: { id: Number.parseInt(id) } })
      
      return {
          title: res.data.resourceById.title,
          description: res.data.resourceById.description,
          openGraph: {
              title: res.data.resourceById.title,
              description: res.data.resourceById.description,
              images: res.data.resourceById.resourcesImagesByResourceId.nodes.length > 0 ? 
                  res.data.resourceById.resourcesImagesByResourceId.nodes.map((imgData: any) => ({ url: urlFromPublicId(imgData.imageByImageId.publicId), width: 400, height: 400 }))
                  :
                  undefined
          }
      }
    } catch (e) {
        //console.log('Unexpected error while generating metadata', e)
        throw e
    }
}

const Page = async () => <ViewResourcePage />

export default Page