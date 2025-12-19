import { Dialog, Stack, SxProps, Theme, Typography, useTheme, useMediaQuery, IconButton } from "@mui/material"
import React, { PropsWithChildren, useContext, useState } from 'react'
import 'keen-slider/keen-slider.min.css'
import { useKeenSlider } from 'keen-slider/react'
import { UiContext } from "../scaffold/UiContextProvider"
import ChiclenOrEgg from '@/app/img/tokens/chicken-egg.svg'
import TopeValue from '@/app/img/tokens/Tope-value.svg'
import Arrow from '@/app/img/fleche.svg'
import Close from '@/app/img/CROSS.svg'
import Tokens from '@/app/img/TOKENS.svg'
import Check from '@/app/img/CHECK.svg'

interface SlideProps extends PropsWithChildren {
    title: string
    sx?: SxProps<Theme>
}

const Slide = (p: SlideProps) => <Stack className="keen-slider__slide">
    <Stack sx={theme => ({
        padding: '2rem',
        margin: '0 auto',
        overflow: 'auto',
        width: '800px',
        [theme.breakpoints.down('lg')]: {
            width: '500px',
            padding: '1rem'
        },
        [theme.breakpoints.down('sm')]: {
            width: '300px',
            padding: '0.25rem'
        }
    })}>
        <Typography color="primary" variant="h2">{p.title}</Typography>
        <Stack sx={p.sx}>
            { p.children }
        </Stack>
    </Stack>
</Stack>

interface Props {
    visible: boolean
    onClose: () => void
}

const ExplainToken = (p: Props) => {
    const uiContext = useContext(UiContext)
    const [currentSlide, setCurrentSlide] = useState(0)
    const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({ 
        slideChanged(slider) {
            setCurrentSlide(slider.track.details.rel)
        },
        created(slider) {
            setCurrentSlide(0)
        }
    })
    const theme = useTheme()
    const sm = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
    const md = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))

    return <Dialog open={p.visible} onClose={p.onClose} fullWidth maxWidth="md" fullScreen={sm}>
        <Stack alignItems="flex-end">
            <IconButton onClick={p.onClose}>
                <Close width="25px" fill={theme.palette.primary.contrastText} />
            </IconButton>
        </Stack>
        <Stack direction="row" ref={sliderRef} className="keen-slider">
            <Slide title={uiContext.i18n.translator("howItWorksStep1Title")} sx={{ gap: '1rem' }}>
                <Typography variant="body1" color="primary.contrastText">{uiContext.i18n.translator('weNeedToGrow')}</Typography>
                <Typography variant="body1" color="primary.contrastText">{uiContext.i18n.translator('chickenOrEgg')}</Typography>
                <Stack sx={theme => ({ 
                    margin: 'auto', width: '450px',
                    [theme.breakpoints.down('md')]: {
                        width: '300px'
                    },
                    [theme.breakpoints.down('sm')]: {
                        width: '200px'
                    }
                })}>
                    <ChiclenOrEgg width="100%" />
                </Stack>
            </Slide>
            <Slide title={uiContext.i18n.translator("howItWorksStep2Title")} sx={{ gap: '1rem' }}>
                <Typography variant="body1" color="primary.contrastText">{uiContext.i18n.translator('barterIsCool')}</Typography>
                <Typography variant="body1" color="primary.contrastText">{uiContext.i18n.translator('moneyToTheRescue')}</Typography>
                <Stack sx={theme => ({ 
                    margin: 'auto', width: '450px',
                    [theme.breakpoints.down('md')]: {
                        width: '300px'
                    },
                    [theme.breakpoints.down('sm')]: {
                        width: '200px'
                    }
                })}>
                    <TopeValue width="100%" />
                </Stack>
            </Slide>
            <Slide title={uiContext.i18n.translator("howItWorksStep4Title")} sx={{ gap: '1rem' }}>
                <Typography variant="body1" color="primary.contrastText">{uiContext.i18n.translator('earnTokens')}</Typography>
                {[uiContext.i18n.translator('newResource'), uiContext.i18n.translator('nicePic'), uiContext.i18n.translator('completeProfile'), uiContext.i18n.translator('exchangeResourcesAgainsTokens'), uiContext.i18n.translator('takePartInCampaigns'), '...'].map((text, idx) => 
                    <Stack key={idx} direction="row" gap="1rem" alignItems="center">
                        <Stack direction="row">
                            <Check fill="#4BB543" width="40" />
                            <Tokens width="40" />
                        </Stack>
                        <Typography variant="body1" color="primary.contrastText">{text}</Typography>
                    </Stack>
                )}
            </Slide>
        </Stack>
        <Stack direction="row" justifyContent="space-between">
            <IconButton sx={{ visibility: currentSlide === 0 ? 'hidden': 'inherit', transform: 'scaleX(-1)' }} onClick={() => instanceRef.current?.prev()}>
                <Arrow width="30px" fill={theme.palette.primary.contrastText} />
            </IconButton>
            <IconButton sx={{ visibility: currentSlide === 2 ? 'hidden': 'inherit' }} onClick={() => instanceRef.current?.next()}>
                <Arrow width="30px" fill={theme.palette.primary.contrastText} />
            </IconButton>
        </Stack>
    </Dialog>
}

export default ExplainToken