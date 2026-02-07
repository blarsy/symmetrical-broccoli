import { gql, useQuery } from "@apollo/client"
import LoadedZone from "../scaffold/LoadedZone"
import { Box, Stack, Typography, useTheme } from "@mui/material"
import { urlFromPublicId } from "@/lib/images"
import { fonts } from "@/theme"
import { lightPrimaryColor } from "@/utils"
import Link from "next/link"
import { getCommonConfig } from '@/config'

const TOP_RESOURCES = gql`query TopResources {
  topResources {
    nodes {
      id
      expiration
      title
      resourcesImagesByResourceId(first: 1) {
        nodes {
          imageByImageId {
            publicId
            id
          }
        }
      }
      accountsPublicDatumByAccountId {
        id
        name
      }
    }
  }
}`

const ResourcesGallery = () => {
    const { loading, data, error } = useQuery(TOP_RESOURCES)
    const theme = useTheme()
    const { mainVersion } = getCommonConfig()

    return <LoadedZone loading={loading} error={error} 
      containerStyle={{ alignSelf: 'stretch', flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
        { data && data.topResources.nodes.map((rawRes:any, idx: number) => 
        <Box key={idx} sx={{ 
            borderWidth: 2,
            borderColor: '#000',
            borderStyle: "solid",
            flex: '0 1 20%',
            [theme.breakpoints.down('lg')]: {
                flex: '0 1 30%'
            },
            [theme.breakpoints.down('md')]: {
                flex: '0 1 45%'
            },
            [theme.breakpoints.down('sm')]: {
                flex: '0 1 100%'
            }
        }}>
            <Link href={`/webapp/${mainVersion}/view/${rawRes.id}`}>
              <Typography textAlign="center" fontFamily={fonts.sugar.style.fontFamily} fontSize={14}
                  color="#000" borderBottom="2px solid #000"
                  sx={{
                      backgroundColor: lightPrimaryColor
                  }}>{rawRes.title}</Typography>
              <img style={{
                  width: '100%',
                  display: 'block'
              }} src={urlFromPublicId(rawRes.resourcesImagesByResourceId.nodes[0].imageByImageId.publicId)} />
              <Typography textAlign="center" fontFamily={fonts.sugar.style.fontFamily} fontSize={14}
                  color="#000" borderTop="2px solid #000"
                  sx={{
                      backgroundColor: lightPrimaryColor
                  }}>par {rawRes.accountsPublicDatumByAccountId.name}</Typography>
            </Link>
        </Box>) }
    </LoadedZone>
}

export default ResourcesGallery