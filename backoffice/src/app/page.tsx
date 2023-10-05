"use client"
import { primaryColor } from "@/utils"
import { Box, IconButton, Stack, Typography } from "@mui/material"
import theme, { fonts } from '@/theme'
import { ThemeProvider } from "@emotion/react"
import FbLogo from './img/FACEBOOK.svg'
import InstaLogo from './img/INSTAGRAM.svg'
import Logo from './img/LOGO-TOPE LA.svg'
import smartphone from './img/IPHONE.png'
import MarqueeBackground from './img/FOND.svg'
import ComingSoon from './img/BIENTOT DISPO.svg'
import { useCallback, useRef } from "react"
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

const STEPS = 6

const Page = () => {
    const swiperRef = useRef<SwiperType>()

    return <ThemeProvider theme={theme}>
        <Stack sx={{ backgroundColor: primaryColor, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Stack flexDirection="row" justifyContent="flex-end" padding="1rem 1rem 0 0" gap="1rem">
                <FbLogo alt="Logo Facebook" height={33}/>
                <InstaLogo alt="Logo Instagram" height={33}/>
            </Stack>
            <Stack alignItems="center">
                <Logo alt="Logo Tope-la" height={323}/>
            </Stack>
            <Stack flexDirection="row" justifyContent="center" alignItems="flex-start" gap="2rem">
                <Stack flex="0 1 40%" alignItems="center">
                    <Typography color="#fff" lineHeight={44/48} fontFamily={fonts.title.style.fontFamily} fontWeight={400}  fontSize={48} textTransform="uppercase" 
                        sx={{ transform: 'rotate(-3.7deg)' }}>L&#39;app des assos&#39; qui fait tourner les ressources.</Typography>
                    <Typography textAlign="center" sx={{ 
                        fontSize: 21, 
                        padding: '5rem',
                        backgroundImage: `url('/FOND.svg')`,
                        backgroundRepeat: 'no-repeat',
                        backgroundAttachment: 'local',
                        backgroundSize: '100%'
                    }}>La solidarit&#233;, on y croit dur comme fer.&#160; La mission de Tope-l&#224; est archi-simple : mettre en lien les associations qui ont des ressources &#224; partager avec celles qui en ont besoin gr&#226;ce au don ou l&#8217;&#233;change.</Typography>
                    <Typography textAlign="center" color="#fff" fontSize={21}>Y a rien d&apos;autre &agrave; dire<br/>Oui, on vous l&apos;avais bien dit que c&apos;&eacute;tait archi-simple.</Typography>
                </Stack>
                <Box flex="0 1 25%">
                    <img src={smartphone.src} width="100%" alt="smartphone"/>
                </Box>
            </Stack>
            <Stack height={356} position="relative">
                <Stack position="absolute" top="-300px" width="100%" height="656px">
                    <MarqueeBackground style={{ width: '120%', height: '100%', left: '-10%', position: 'relative', transform: 'rotate(180deg)' }} alt="fond" />
                    <Stack flex="1" flexDirection="row" alignItems="center" position="absolute" width="100%" height="100%">
                        <IconButton style={{ transform: 'scaleX(-1)', fill: primaryColor }} onClick={() => {
                            swiperRef.current?.slidePrev()
                        }}>
                            <Arrow width={42} height={42} alt="fleche droite"/>
                        </IconButton>
                        <Swiper onBeforeInit={(swiper) => {
                                swiperRef.current = swiper;
                            }} >
                            <SwiperSlide style={{ display: 'flex',flexDirection: 'column', alignItems: 'center', alignSelf: 'center' }}>
                                <Step1 />
                            </SwiperSlide>
                            <SwiperSlide style={{ display: 'flex',flexDirection: 'column', alignItems: 'center', alignSelf: 'center' }}>
                                <Step2 />
                            </SwiperSlide>
                            <SwiperSlide style={{ display: 'flex',flexDirection: 'column', alignItems: 'center', alignSelf: 'center' }}>
                                <Step3 />
                            </SwiperSlide>
                            <SwiperSlide style={{ display: 'flex',flexDirection: 'column', alignItems: 'center', alignSelf: 'center' }}>
                                <Step4 />
                            </SwiperSlide>
                            <SwiperSlide style={{ display: 'flex',flexDirection: 'column', alignItems: 'center', alignSelf: 'center' }}>
                                <Step5 />
                            </SwiperSlide>
                            <SwiperSlide style={{ display: 'flex',flexDirection: 'column', alignItems: 'center', alignSelf: 'center' }}>
                                <Step6 />
                            </SwiperSlide>
                        </Swiper>
                        <IconButton style={{ fill: primaryColor }} onClick={() => {
                            swiperRef.current?.slideNext()
                        }}>
                            <Arrow style={{ color: primaryColor }} width={42} height={42} alt="fleche droite"/>
                        </IconButton>
                    </Stack>
                </Stack>
            </Stack>
            <Stack alignItems="center">
                <ComingSoon alt="Bientôt disponible" height={274}/>
            </Stack>
        </Stack>
    </ThemeProvider>
}

export default Page