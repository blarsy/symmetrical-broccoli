"use client"
import { primaryColor } from "@/utils"
import { Box, Stack, Theme, Typography, TypographyOwnProps, useTheme } from "@mui/material"
import createTheme, { fonts } from '@/theme'
import { ThemeProvider } from "@emotion/react"
import FbLogo from './img/FACEBOOK.svg'
import InstaLogo from './img/INSTAGRAM.svg'
import Logo from './img/LOGO-TOPE LA.svg'
import Googleplay from './img/google-play.svg'
import AppStore from './img/app-store.svg'
import TopperBabysitter from './img/toppers/babysitter.svg'
import TopperBikeRepairer from './img/toppers/bike-repairer.svg'
import TopperDev from './img/toppers/dev.svg'
import TopperGardener from './img/toppers/gardener.svg'
import TopperHandyman from './img/toppers/handyman.svg'
import TopperPainter from './img/toppers/painter.svg'
import TopperPastryChef from './img/toppers/pastry-chef.svg'
import TopperScout from './img/toppers/scout.svg'
import TopperJeweler from './img/toppers/jewelry-maker.svg'
import Link from "next/link"
import useMediaQuery from '@mui/material/useMediaQuery'
import { Button } from "@mui/material"
import QuestionIcon from "@mui/icons-material/QuestionMark"
import QAIcon from "@mui/icons-material/QuestionAnswer"
import { ApolloProvider } from "@apollo/client"
import { getApolloClient } from "@/lib/apolloClient"
import { getCommonConfig } from "@/config"
import { keyframes, SxProps } from '@mui/system'
import ResourcesGallery from "@/components/showcase/ResourcesGallery"
import { ReactNode } from "react"
import AccountsGallery from "@/components/showcase/AccountsGallery"
import Roadmap from "@/components/showcase/Roadmap"

const { mainVersion, link2Url } = getCommonConfig()

const ToppersBar = () => {
    const theme= useTheme()

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

    const width = theme.breakpoints.up('md') ? '200px' : '150px'
    return [<Box key="1" style={{ position: 'relative', height: width, width }}>
        <Box sx={{ position: 'absolute', opacity: 0, animation: `${appear_3_1} 15s linear 0s infinite` }}>
            <TopperHandyman width={width} />
        </Box>
        <Box sx={{ position: 'absolute', opacity: 0, animation: `${appear_3_2} 15s linear 0s infinite` }}>
            <TopperPainter width={width} />
        </Box>
        <Box sx={{ position: 'absolute', opacity: 0, animation: `${appear_3_3} 15s linear 0s infinite` }}>
            <TopperPastryChef width={width} />
        </Box>
    </Box>, <Box key="2" style={{ position: 'relative', height: width, width }}>
        <Box sx={{ position: 'absolute', opacity: 0, animation: `${appear_3_1} 15s linear 0s infinite` }}>
            <TopperGardener width={width} />
        </Box>
        <Box sx={{ position: 'absolute', opacity: 0, animation: `${appear_3_2} 15s linear 0s infinite` }}>
            <TopperDev width={width} />
        </Box>
        <Box sx={{ position: 'absolute', opacity: 0, animation: `${appear_3_3} 15s linear 0s infinite` }}>
            <TopperJeweler width={width} />
        </Box>
    </Box>, <Box key="3" style={{ position: 'relative', height: width, width }}>
        <Box sx={{ position: 'absolute', opacity: 0, animation: `${appear_3_1} 15s linear 0s infinite` }}>
            <TopperBabysitter width={width} />
        </Box>
        <Box sx={{ position: 'absolute', opacity: 0, animation: `${appear_3_2} 15s linear 0s infinite` }}>
            <TopperBikeRepairer width={width} />
        </Box>
        <Box sx={{ position: 'absolute', opacity: 0, animation: `${appear_3_3} 15s linear 0s infinite` }}>
            <TopperScout width={width} />
        </Box>
    </Box> ]
}

interface TeamMemberProps {
    imageUrl: string
    firstName: string
    fullName: string
    title: string
}

const TeamMember = (p: TeamMemberProps) => {
    const theme = useTheme()
    return <Stack sx={{
        width: '500px',
        [theme.breakpoints.down('lg')]: {
            width: '350px'
        },
        [theme.breakpoints.down('sm')]: {
            width: '300px'
        }
    }}>
        <img src={p.imageUrl} alt={p.firstName}/>
        <Typography color="#000" fontFamily={fonts.title.style.fontFamily} fontWeight={400} fontSize={24} lineHeight={1} textTransform="uppercase" textAlign="center">{p.fullName}</Typography>
        <Typography color="#000" fontFamily={fonts.sugar.style.fontFamily} fontWeight={400} fontSize={20} textAlign="center">{p.title}</Typography>
    </Stack>
}

interface SectionTitleRun {
    color: TypographyOwnProps['color'], text: string
}
interface SectionTitleProps {
    lines: Array<Array<SectionTitleRun>>
    sx?: SxProps<Theme>
}

const SectionTitle = (p : SectionTitleProps) => <Stack sx={{ transform: 'rotate(-3.7deg)', marginBottom: '2rem', alignItems: 'center', ...p.sx }}>
    { p.lines.map((line, idx) => <Box key={idx}>
        { line.map((run, idx) => <Typography key={idx} component="span" color={run.color} lineHeight={1} fontFamily={fonts.title.style.fontFamily} variant="h1">{run.text}</Typography> )}    </Box> )}
</Stack>

const ParchmentContainer = ({ children }: { children: ReactNode}) => {
    const theme = useTheme()
    return <Stack flex="1" alignItems="center" sx={{
        backgroundColor: '#fcf5ef',
        position: 'relative',
        padding: '2rem 0',
        [theme.breakpoints.up('md')]: {
            backgroundColor: 'transparent',
            backgroundImage: `url('/FOND-180.svg')`,
            backgroundRepeat: 'no-repeat',
            backgroundOrigin: "border-box",
            backgroundPosition: 'top',
            backgroundSize: '130% 100%',
            padding: '8rem 0 6rem'
        }
    }}>
        {children}
    </Stack>
}

const SMALL_TEXT_SIZE = 18

const Page = () => {
    const dark = useMediaQuery('(prefers-color-scheme: dark)')
    const theme = createTheme(dark)
    
    return <ApolloProvider client={getApolloClient(mainVersion)}>
        <ThemeProvider theme={theme}>
            <Stack sx={{ backgroundColor: primaryColor, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Stack alignItems="center" marginBottom="50px">
                    <Logo alt="Logo Tope-la" height={323}/>
                </Stack>
                <Stack flexDirection="row" justifyContent="center" alignItems="flex-start">
                    <Stack sx={theme => ({
                        flex: '0 0 40%',
                        [theme.breakpoints.down('lg')]: {
                            flex: '0 0 80%',
                        },[theme.breakpoints.down('md')]: {
                            flex: '0 0 90%',
                            paddingBottom: '2rem'
                        }
                    })} alignItems="center">
                        <SectionTitle lines={[
                            [ { color: '#000', text: 'L\'app qui fait ' }, { color: '#fff', text: 'tourner'} ],
                            [ { color: '#000', text: 'les ' }, { color: '#fff', text: 'ressources' } ]
                        ]} />
                        <Box sx={{ 
                            padding: '1rem 10%',
                            fontSize: SMALL_TEXT_SIZE,
                            [theme.breakpoints.down('md')]: {
                                padding: '2.5rem 1.5rem'
                            },
                            alignItems: 'center'
                        }}>
                            <Typography component="p" variant="body2" fontSize={SMALL_TEXT_SIZE} textAlign="center" color="#fff" >La solidarit&#233;, on y croit dur comme fer.</Typography>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography component="span" variant="body2" fontSize={SMALL_TEXT_SIZE} textAlign="center" color="#000" >La mission de Tope-l&#224; est archi-simple : mettre en lien les passionné.e.s, engagé.e.s, inspiré.e.s qui ont des ressources &#224; partager avec ceux qui en ont besoin gr&#226;ce au </Typography>
                                <Typography component="span" variant="body2" fontSize={SMALL_TEXT_SIZE} textAlign="center" color="#fff" >don</Typography>
                                <Typography component="span" variant="body2" fontSize={SMALL_TEXT_SIZE} textAlign="center" color="#000" > ou </Typography>
                                <Typography component="span" variant="body2" fontSize={SMALL_TEXT_SIZE} textAlign="center" color="#fff" >l&#8217;&#233;change.</Typography>
                            </Box>
                        </Box>
                        <Button variant="outlined" startIcon={<QuestionIcon/>} endIcon={<QAIcon/>} target="_blank"
                            href={link2Url}
                            style={{ color: '#fff', borderColor: '#ccc', alignSelf: 'center', justifyContent: 'center', 
                            marginTop: '2rem', fontFamily: fonts.title.style.fontFamily, fontSize: '1.4rem', 
                            borderRadius: '1rem' }}>Foire aux questions</Button>
                    </Stack>
                    <Box sx={theme => ({
                        [theme.breakpoints.down('lg')]: {
                            display: 'none',
                        },
                        transform: 'rotate(12deg)',
                        maxWidth: 380
                    })} flex="0 1">
                        <img alt="smartphone" src="phone.png" style={{ 
                            objectFit: 'contain', 
                            maxWidth: 380,
                            position: 'relative',
                            top: '-100px',
                            marginBottom: '-300px' }}/>
                    </Box>
                </Stack>
                <ParchmentContainer>
                    <SectionTitle lines={[
                        [ { color: '#000', text: 'Tope là c\'est ' } ],[ { color: primaryColor, text: 'pour qui ?'} ],
                    ]} />
                    <Stack flexDirection="row" gap="2rem" flexWrap="wrap" justifyContent="center">
                        <ToppersBar />
                    </Stack>
                </ParchmentContainer>
                <Stack alignItems="center" justifyContent="center" padding="3rem">
                    <Typography color="#000" textAlign="center" fontFamily={fonts.sugar.style.fontFamily} fontSize={28} fontWeight={400} paddingTop="1rem" paddingBottom="1rem">Télécharge sur</Typography>
                    <Stack sx={theme => ({
                        flexDirection: 'column',
                        gap: '1rem',
                        [theme.breakpoints.up('sm')]: {
                            flexDirection: 'row',
                            gap: '0'
                        },
                    })}>
                        <Link target="_blank" href="https://play.google.com/store/apps/details?id=com.topela"><Googleplay height={80}/></Link>
                        <Link target="_blank" href="https://apps.apple.com/app/tope-la/id6470202780"><AppStore height={80}/></Link>
                    </Stack>
                    <Typography color="#000" textAlign="center" fontFamily={fonts.sugar.style.fontFamily} fontSize={28} fontWeight={400} paddingTop="1rem" paddingBottom="1rem">Version web</Typography>
                    <Link target="_blank" href={`webapp/${mainVersion}`} style={{ color: '#000', fontSize: '1.7rem', fontFamily: fonts.general.style.fontFamily, fontWeight: 900 }}>
                        <Box sx={{ backgroundImage: `url('/FOND-180.svg')`, height: 80, display: 'flex', alignItems: 'center', padding: '0 2rem' }}>
                            Connexion
                        </Box>
                    </Link>
                    <Typography color="#000" textAlign="center" fontFamily={fonts.sugar.style.fontFamily} fontSize={28} fontWeight={400} paddingTop="1rem" paddingBottom="1rem">Suis-nous</Typography>
                    <Box display="flex" flexDirection="row" gap="1.5rem">
                        <Link href="https://www.facebook.com/profile.php?id=61552205033496" target="_blank"><FbLogo alt="Logo Facebook" height={60}/></Link>
                        <Link href="https://www.instagram.com/tope.la.app/" target="_blank"><InstaLogo alt="Logo Instagram" height={60}/></Link>
                    </Box>
                </Stack>
                <Stack alignItems="center" justifyContent="center" gap="1rem" direction="column" padding="3rem">
                    <SectionTitle lines={[
                        [{ color: '#fff', text: 'Ressources ' }, { color: '#000', text: 'récentes' }]
                    ]} sx={{ padding: '3rem 0' }}/>
                    <ResourcesGallery />
                </Stack>
                <ParchmentContainer>
                    <SectionTitle lines={[
                        [{ color: primaryColor, text: 'Notre ' }, { color: '#000', text: 'team' }]
                    ]} sx={{ margin: '2rem 0 0' }}/>
                    <Stack flexDirection="row" gap="2rem" flexWrap="wrap" justifyContent="center">
                        <TeamMember firstName="Bertrand" fullName="Bertrand Larsy" imageUrl="/Portrait Bertrand.png" title="Cofondateur & développeur" />
                        <TeamMember firstName="Alice" fullName="Alice Beck" imageUrl="/Portrait Alice.png" title="Cofondatrice & Directrice artistique" />
                    </Stack>
                </ParchmentContainer>
                <AccountsGallery />
                <Roadmap />
            </Stack>
        </ThemeProvider>
    </ApolloProvider>
}

export default Page