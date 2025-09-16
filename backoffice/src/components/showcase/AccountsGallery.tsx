import { fonts } from "@/theme"
import { gql, useQuery } from "@apollo/client"
import { Box, keyframes, Stack, Theme, Typography, useTheme } from "@mui/material"
import { urlFromPublicId } from "@/lib/images"
import SketchyCircle from '@/app/img/sketchy-circle.svg'
import StairHands from '@/app/img/stair-hands.svg'
import { useEffect, useState } from "react"
import { primaryColor } from "@/utils"

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

const appear_2_1 = keyframes`
    0%   {opacity: 0;}
    5%  {opacity: 1;}
    45%   {opacity: 1;}
    50%  {opacity: 0;}
`
const appear_2_2 = keyframes`
    50%   {opacity: 0;}
    55%  {opacity: 1;}
    95%   {opacity: 1;}
    100%  {opacity: 0;}
`

const appear_3_1 = keyframes`
    0%   {opacity: 0;}
    3%  {opacity: 1;}
    30%   {opacity: 1;}
    33%  {opacity: 0;}
`
const appear_3_2 = keyframes`
    34%   {opacity: 0;}
    36%  {opacity: 1;}
    63%   {opacity: 1;}
    66%  {opacity: 0;}
`
const appear_3_3 = keyframes`
    67%   {opacity: 0;}
    70%  {opacity: 1;}
    97%   {opacity: 1;}
    100%  {opacity: 0;}
`
const keyFrames2 = [appear_2_1, appear_2_2]
const keyFrames3 = [appear_3_1, appear_3_2, appear_3_3]

interface LogoRoundRobinProps {
    publicIds: string[]
}

const ImgWithAnimation = ({ src, animation }:{ src: string, animation: string }) => <Box sx={{
        opacity: 0, animation
    }}>
        <img src={src} style={{
            position: 'absolute', width: '100%', height: '100%'
        }} />
    </Box>

const LogoRoundRobin = (p: LogoRoundRobinProps) => {
    if(p.publicIds.length === 1) {
        return <img src={urlFromPublicId(p.publicIds[0])} style={{
            position: 'absolute', width: '100%', height: '100%'
        }} />
    } else if(p.publicIds.length === 2) {
        return <Box sx={{ position: 'absolute', width: '100%', height: '100%' }}>
            { p.publicIds.map((publicId, idx) => 
                <ImgWithAnimation key={idx} src={ urlFromPublicId(publicId)} animation={`${keyFrames2[idx]} 15s linear 0s infinite`} />)
            }
        </Box>
    } else if(p.publicIds.length === 3) {
        return <Box sx={{ position: 'absolute', width: '100%', height: '100%' }}>
            { p.publicIds.map((publicId, idx) => 
                <ImgWithAnimation key={idx} src={ urlFromPublicId(publicId)} animation={`${keyFrames3[idx]} 15s linear 0s infinite`} />)
            }
        </Box>
    }

}

interface LogoBadgeProps {
    images: Array<{ 
        publicId: string
        name: string
    }>
    index: number
}

const LogoBadge = (p: LogoBadgeProps) => {
    const theme = useTheme()
    const LARGE_BUBBLE_SIZE = 200, SMALL_BUBBLE_SIZE = 112
    const HIGHEST_POSITION = -75, LOWEST_POSITION = 325
    const MOST_LEFTY_POSITION  = -100, LEAST_LEFTY_POSITION = 350
    let smTop, mdTop, lgTop: number
    let smLeft, mdLeft, lgLeft: number

    switch(p.index) {
        case 1:
            lgTop = HIGHEST_POSITION
            lgLeft = LEAST_LEFTY_POSITION
            break
        case 2:
            lgTop = HIGHEST_POSITION + (LOWEST_POSITION - HIGHEST_POSITION) / 2
            lgLeft = MOST_LEFTY_POSITION
            break
        case 3:
            lgTop = LOWEST_POSITION
            lgLeft = LEAST_LEFTY_POSITION * 0.8
            break
        default:
            throw new Error(`Unexpected logo badge index ${p.index}`)
    }

    mdTop = lgTop * 0.75
    mdLeft = lgLeft * 0.75
    smTop = lgTop * 0.5
    smLeft = lgLeft * 0.5

    return <Box sx={{ position: 'absolute', 
        width: `${LARGE_BUBBLE_SIZE}px`, height: `${LARGE_BUBBLE_SIZE}px`,top: lgTop, left: lgLeft,
        [theme.breakpoints.down('md')]: {
            width: `${SMALL_BUBBLE_SIZE + ((LARGE_BUBBLE_SIZE - SMALL_BUBBLE_SIZE) / 2)}px`, height: `${SMALL_BUBBLE_SIZE + ((LARGE_BUBBLE_SIZE - SMALL_BUBBLE_SIZE) / 2)}px`,top: mdTop, left: mdLeft,
        },[theme.breakpoints.down('sm')]: {
            width: `${SMALL_BUBBLE_SIZE}px`, height: `${SMALL_BUBBLE_SIZE}px`,top: smTop, left: smLeft,
        }
    }}>
        <LogoRoundRobin publicIds={p.images.map(img => img.publicId)} />
        <SketchyCircle style={{ fill: primaryColor, position: 'absolute', width: '100%', height: '100%' }} />
    </Box>
}

const AccountsGallery = () => {
    const theme = useTheme()
    const {data} = useQuery(TOP_ACCOUNTS)
    const [logoList, setLogoList] = useState<Array<Array<{ publicId: string, name: string }>>>([[],[],[]])

    useEffect(() => {
        if(data) {
            const logos: Array<Array<{ publicId: string, name: string }>> = [[],[],[]]
            data.topAccounts.nodes.forEach((rawAccount: any, idx: number) => {
                switch(idx % 3) {
                    case 0:
                        if(logos[0].length < 3) {
                            logos[0].push({ publicId: rawAccount.imageByAvatarImageId.publicId, name: rawAccount.name })
                        }
                        break
                    case 1:
                        if(logos[1].length < 3) {
                            logos[1].push({ publicId: rawAccount.imageByAvatarImageId.publicId, name: rawAccount.name })
                        }
                        break
                    case 2:
                        if(logos[2].length < 3) {
                            logos[2].push({ publicId: rawAccount.imageByAvatarImageId.publicId, name: rawAccount.name })
                        }
                        break
                    default:
                }
            })
            setLogoList(logos)
        }
    }, [data])

    return <Stack padding="3rem 0 4rem">
        <Stack sx={{ transform: 'rotate(3.19deg)', alignItems: 'center', marginBottom: '4rem' }}>
            <Typography color="#fff" lineHeight={1} fontFamily={fonts.title.style.fontFamily} fontWeight={400} fontSize={36} textTransform="uppercase">Ensemble</Typography>
            <Typography color="#fff" lineHeight={1} fontFamily={fonts.title.style.fontFamily} fontWeight={400} fontSize={36} textTransform="uppercase">On est plus fort:</Typography>
            <Typography color="#000" fontFamily={fonts.sugar.style.fontFamily} fontWeight={400} fontSize={24} paddingTop="1rem">Rejoignez-les !</Typography>
        </Stack>
        <Stack flexDirection="row" justifyContent="center">
            <Stack sx={{
                position: 'relative',
                flex: '0 0 400px',
                [theme.breakpoints.down('md')]: {
                    flex: '0 0 300px',
                },[theme.breakpoints.down('sm')]: {
                    flex: '0 0 200px',
                }
            }}>
                <LogoBadge images={logoList[0]} index={1} />
                <LogoBadge images={logoList[1]} index={2} />
                <LogoBadge images={logoList[2]} index={3} />
                <StairHands />
            </Stack>
        </Stack>
    </Stack>
}

export default AccountsGallery