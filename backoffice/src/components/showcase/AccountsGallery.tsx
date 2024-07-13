import { fonts } from "@/theme"
import { gql, useQuery } from "@apollo/client"
import { Card, CircularProgress, Stack, Theme, Typography } from "@mui/material"
import useMediaQuery from '@mui/material/useMediaQuery'
import Image from 'next/image'
import { urlFromPublicId } from "@/lib/images"
import { lightPrimaryColor } from "@/utils"

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

const TopAccounts = ({ theme }: { theme: Theme }) => {
    const {data, loading, error} = useQuery(TOP_ACCOUNTS)
    const smallScreen = useMediaQuery(theme.breakpoints.down('md'))
    const medScreen = useMediaQuery(theme.breakpoints.up('md'))

    const imgSize = smallScreen ? 200 : (medScreen ? 250 : 300)

    if(loading) return <CircularProgress  />

    if(error) return <Typography variant="body2" color="error">Problème de chargement</Typography>

    if(data.topAccounts.nodes.length === 0) return <Typography variant="body2">Problème de chargement</Typography>
    
    return <Stack style={{ flexDirection: 'row', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
        { data.topAccounts.nodes.map((account: any, idx: number) => {
            return <Card key={idx} elevation={5} style={{ display:'flex', flexDirection: 'column', backgroundColor: lightPrimaryColor, color: '#000', borderRadius: '1rem', padding: '1rem', gap: '1rem' }}>
                <Typography style={{ fontFamily: fonts.title.style.fontFamily, fontWeight: 400, textAlign: 'center' }}>{account.name}</ Typography>
                <Image style={{ borderRadius: '2.5rem' }} width={imgSize} height={imgSize} src={urlFromPublicId(account.imageByAvatarImageId.publicId)} alt={`Ìmage ${account.name}`}  />
            </Card>
        }) }
    </Stack>
}

const AccountsGallery = ({ theme }: { theme: Theme }) => {
    const smallScreen = useMediaQuery(theme.breakpoints.down('md'))
    return <Stack paddingTop="2rem">
        <Typography textAlign="center" color="#fff" lineHeight={44/48} fontFamily={fonts.title.style.fontFamily} fontWeight={400}  fontSize={48} textTransform="uppercase" 
            sx={{ transform: 'rotate(3.7deg)', marginBottom: '2rem' }}>Rejoignez-les !</Typography>
        <Stack alignContent="center" padding={smallScreen ? '2rem' : '5rem'} sx={{
            backgroundColor: '#fcf5ef',
            [theme.breakpoints.up('md')]: {
                backgroundColor: 'transparent',
                backgroundImage: `url('/FOND.svg')`,
                backgroundRepeat: 'no-repeat',
                backgroundOrigin: "border-box",
                backgroundPosition: 'top',
                backgroundSize: '110% 100%'
            }
        }}>
            <TopAccounts theme={theme} />
        </Stack>
    </Stack>
}

export default AccountsGallery