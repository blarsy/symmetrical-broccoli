"use client"
import { primaryColor } from "@/utils"
import { Box, IconButton, Stack, Theme, Typography } from "@mui/material"
import createTheme, { fonts } from '@/theme'
import { ThemeProvider } from "@emotion/react"
import FbLogo from './img/FACEBOOK.svg'
import InstaLogo from './img/INSTAGRAM.svg'
import Logo from './img/LOGO-TOPE LA.svg'
import smartphone from './img/IPHONE.png'
import Googleplay from './img/google-play.svg'
import AppStore from './img/app-store.svg'
import LetsConnect from './img/CONNECTONS NOUS.svg'
import { useRef, useState } from "react"
import Step1 from "@/components/explainSteps/Step1"
import Arrow from './img/fleche.svg'
import Step2 from "@/components/explainSteps/Step2"
import Step3 from "@/components/explainSteps/Step3"
import Step4 from "@/components/explainSteps/Step4"
import Step5 from "@/components/explainSteps/Step5"
import Step6 from "@/components/explainSteps/Step6"
import { Swiper, SwiperSlide } from 'swiper/react'
import 'swiper/css'
import 'swiper/css/navigation'
import { Swiper as SwiperType } from "swiper"
import { Autoplay } from 'swiper/modules'
import Link from "next/link"
import useMediaQuery from '@mui/material/useMediaQuery'

const PresentationCarousel = ({ theme }: { theme: Theme }) => {
    const swiperRef = useRef<SwiperType>()
    const [swiperSlideState, setSwiperSlideState] = useState({ begin: true, end: false })

    const refreshSwiperSlideState = () => {
        if(swiperRef && swiperRef.current && (swiperRef.current.isBeginning != swiperSlideState.begin || swiperRef.current.isEnd != swiperSlideState.end)){
            setSwiperSlideState({ begin: swiperRef.current.isBeginning, end: swiperRef.current.isEnd })
        }
    }

    return <Stack flex="1" flexDirection="row" alignItems="center" sx={{
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
        
        <IconButton style={{ transform: 'scaleX(-1)', fill: primaryColor, visibility: !swiperSlideState.begin ? 'visible': 'hidden' }} onClick={() => {
            swiperRef.current?.slidePrev()
        }}>
            <Arrow width={42} height={42} alt="fleche droite"/>
        </IconButton>
        <Swiper modules={[ Autoplay ]} onBeforeInit={(swiper) => {
                swiperRef.current = swiper
            }} onTransitionEnd={t => {
                refreshSwiperSlideState()
            }} autoplay={{
                delay: 5000
            }} style={{ flex: 1, overflow: 'hidden' }}>
            <SwiperSlide style={{ display: 'flex',flexDirection: 'column', alignItems: 'center', alignSelf: 'center' }}>
                <Step1 />
            </SwiperSlide>
            <SwiperSlide style={{ display: 'flex',flexDirection: 'column', alignSelf: 'center' }}>
                <Step2 />
            </SwiperSlide>
            <SwiperSlide style={{ display: 'flex',flexDirection: 'column', alignItems: 'center', alignSelf: 'center' }}>
                <Step3 />
            </SwiperSlide>
            <SwiperSlide style={{ display: 'flex',flexDirection: 'column', alignSelf: 'center' }}>
                <Step4 />
            </SwiperSlide>
            <SwiperSlide style={{ display: 'flex',flexDirection: 'column', alignItems: 'center', alignSelf: 'center' }}>
                <Step5 />
            </SwiperSlide>
            <SwiperSlide style={{ display: 'flex',flexDirection: 'column', alignSelf: 'center' }}>
                <Step6 />
            </SwiperSlide>
        </Swiper>
        <IconButton style={{ fill: primaryColor, visibility: !swiperSlideState.end ? 'visible': 'hidden' }} onClick={() => {
            swiperRef.current?.slideNext()
        }}>
            <Arrow style={{ color: primaryColor }} width={42} height={42} alt="fleche droite"/>
        </IconButton>
    </Stack>
}

const Page = () => {
    const dark = useMediaQuery('(prefers-color-scheme: dark)')
    const theme = createTheme(dark)
    
    return <ThemeProvider theme={theme}>
        <Stack sx={{ backgroundColor: primaryColor, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Stack flexDirection="row" justifyContent="flex-end" padding="1rem 1rem 0 0" gap="1rem">
                <Link href="https://www.facebook.com/profile.php?id=61552205033496" target="_blank"><FbLogo alt="Logo Facebook" height={33}/></Link>
                <Link href="https://www.instagram.com/tope.la.app/" target="_blank"><InstaLogo alt="Logo Instagram" height={33}/></Link>
            </Stack>
            <Stack alignItems="center">
                <Logo alt="Logo Tope-la" height={323}/>
            </Stack>
            <Stack flexDirection="row" justifyContent="center" alignItems="flex-start" gap="2rem" paddingBottom="2rem">
                <Stack sx={theme => ({
                    flex: '0 1 40%',
                    [theme.breakpoints.down('lg')]: {
                        flex: '0 1 80%',
                    },[theme.breakpoints.down('md')]: {
                        flex: '0 1 90%'
                    }
                })} alignItems="center">
                    <Typography textAlign="center" color="#fff" lineHeight={44/48} fontFamily={fonts.title.style.fontFamily} fontWeight={400}  fontSize={48} textTransform="uppercase" 
                        sx={{ transform: 'rotate(-3.7deg)', marginBottom: '2rem' }}>L&#39;app des assos&#39; qui fait tourner les ressources.</Typography>
                    <Typography textAlign="center" color="#000" sx={{ 
                        padding: '3rem',
                        backgroundImage: `url('/FOND.svg')`,
                        backgroundRepeat: 'no-repeat',
                        backgroundAttachment: 'local',
                        backgroundSize: '100% 100%',
                        [theme.breakpoints.down('md')]: {
                            padding: '2.5rem 1.5rem'
                        }
                    }}>La <b>solidarit&#233;</b>, on y croit dur comme fer.&#160; La mission de Tope-l&#224; est archi-simple : mettre en lien les associations qui ont des ressources &#224; partager avec celles qui en ont besoin gr&#226;ce au <b>don</b> ou <b>l&#8217;&#233;change</b>.</Typography>
                    <Link href="https://forms.gle/VhgXtnRToprjWYeU8" style={{ alignSelf: 'center', height: '100px' }}><LetsConnect height="100%" /></Link>
                </Stack>
                <Box sx={theme => ({
                    [theme.breakpoints.down('lg')]: {
                        display: 'none',
                    },
                    height: 410
                })} flex="0 1 25%">
                    <img src={smartphone.src} width="100%" style={{ maxWidth: '430px' }} alt="smartphone"/>
                </Box>
            </Stack>
            <PresentationCarousel theme={theme} />
            <Stack alignItems="center" justifyContent="center" sx={theme => ({
                flexDirection: 'column',
                paddingTop: '2rem',
                gap: '1rem',
                [theme.breakpoints.up('md')]: {
                    paddingTop: '0'
                },
                [theme.breakpoints.up('sm')]: {
                    flexDirection: 'row',
                    gap: '0'
                },
            })} paddingBottom="3rem">
                <Link target="_blank" href="https://play.google.com/store/apps/details?id=com.topela"><Googleplay height={80}/></Link>
                <Link target="_blank" href="https://apps.apple.com/app/tope-la/id6470202780"><AppStore height={80}/></Link>
            </Stack>
        </Stack>
    </ThemeProvider>
}

    

export default Page