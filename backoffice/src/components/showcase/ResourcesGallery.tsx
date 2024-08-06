import { gql } from "@apollo/client"
import { Theme } from "@mui/material"
import WhitePanel from "./WhitePanel"
import ResponsiveGallery from "./ResponsiveGallery"

const TOP_RESOURCES = gql`query TopResources {
    topResources {
      nodes {
        title
        resourcesImagesByResourceId(first: 1) {
          nodes {
            imageByImageId {
              publicId
            }
          }
        }
      }
    }
}`

const ResourcesGallery = ({ theme }: { theme: Theme }) => <WhitePanel title="Ressources récentes" theme={theme}>
    <ResponsiveGallery theme={theme} query={TOP_RESOURCES} itemsFromData={data => data.topResources.nodes.map((resource: any) => ({
        title: resource.title, imagePublicId: resource.resourcesImagesByResourceId.nodes[0].imageByImageId.publicId
    }))} />
</WhitePanel>


export default ResourcesGallery