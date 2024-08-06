import { gql } from "@apollo/client"
import { Box, Theme } from "@mui/material"

import WhitePanel from "./WhitePanel"
import ResponsiveGallery from "./ResponsiveGallery"
import { Stack, useMediaQuery } from "@mui/system"
import ActivityBikeRepair from '@/app/img/activities/veloman.svg'


const TOP_ACCOUNTS = gql`query TopAccounts {
    topAccounts {
      nodes {
        id
        name
        imageByAvatarImageId {
          publicId
        }
      }
    }
}`

const AccountsGallery = ({ theme }: { theme: Theme }) => {
    const smallScreen = useMediaQuery(theme.breakpoints.down('sm'))
    const medScreen = useMediaQuery(theme.breakpoints.up('md'))
    const hugeScreen = useMediaQuery(theme.breakpoints.up('xl'))

    const flexBasis = smallScreen ? '0 0 20%' : (!medScreen ? '0 0 10%' : (hugeScreen ? '0 0 160px' : '0 0 10%'))
    
    return <>
        <Stack direction="row" justifyContent="space-around" flexWrap="wrap" marginTop="-50px">
            {[<ActivityBikeRepair/>,
            <ActivityBikeRepair/>,
            <ActivityBikeRepair/>,
            <ActivityBikeRepair/>,
            <ActivityBikeRepair/>,
            <ActivityBikeRepair/>,
            <ActivityBikeRepair/>,
            <ActivityBikeRepair/>,
            <ActivityBikeRepair/>,
            <ActivityBikeRepair/>].map((img, idx) => <Box key={idx} flex={flexBasis} padding="0.5rem">
                {img}
            </Box>)
            }
        </Stack>
        <WhitePanel title="Rejoignez-les !" theme={theme}>
            <ResponsiveGallery theme={theme} query={TOP_ACCOUNTS} itemsFromData={data => data.topAccounts.nodes.map((account: any) => ({
                title: account.name, imagePublicId: account.imageByAvatarImageId.publicId
            }))} />
        </WhitePanel>
    </>
}


export default AccountsGallery