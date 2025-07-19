import { Dialog, Stack, SxProps, Theme, Typography, useTheme, useMediaQuery, IconButton, Button } from "@mui/material"
import React, { PropsWithChildren, useContext, useState } from 'react'
import 'keen-slider/keen-slider.min.css'
import { useKeenSlider } from 'keen-slider/react'
import { UiContext } from "../scaffold/UiContextProvider"
import ChiclenOrEgg from '@/app/img/tokens/chicken-egg.svg'
import Microwave from '@/app/img/tokens/Micro-onde.svg'
import Cap from '@/app/img/tokens/bonnet.svg'
import Unlock from '@/app/img/tokens/unlock.svg'
import ConsumeTokens from '@/app/img/tokens/consommation jeton.svg'
import Arrow from '@/app/img/fleche.svg'
import Close from '@/app/img/CROSS.svg'
import Tokens from '@/app/img/TOKENS.svg'
import Check from '@/app/img/CHECK.svg'
import { AppContext, AppDispatchContext, AppReducerActionType } from "../scaffold/AppContextProvider"
import { gql, useMutation } from "@apollo/client"
import { LoadingButton } from "@mui/lab"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import Feedback from "../scaffold/Feedback"

export const SWITCH_TO_CONTRIBUTION_MODE = gql`mutation SwitchToContributionMode {
    switchToContributionMode(input: {}) {
        integer
    }
}`

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

interface ImageNumberPropx {
    sx?: SxProps<Theme>
    number: Number
    ratio?: number
}

const ImageNumber = ( p: ImageNumberPropx ) => <Typography sx={[theme => ({
    position: 'absolute', top: `-${10 * (p.ratio || 1)}px`, left: `-${10 * (p.ratio || 1)}px`, backgroundColor: '#000',
    color: '#fff', fontSize: `${20 * (p.ratio || 1)}px`, width: `${40 * (p.ratio || 1)}px`, lineHeight: 1, padding: `${10 * (p.ratio || 1)}px`, textAlign: 'center',
    borderRadius:`${20 * (p.ratio || 1)}px`, fontWeight: 'bolder', transform: 'rotate(-5deg)'
}), ...(Array.isArray(p.sx) ? p.sx : [p.sx])]}>{p.number.toString()}</Typography>

interface NumberedImagesProps {
    start: number
    images: JSX.Element[]
    sx?: SxProps<Theme>
    imageBoxSx?: SxProps<Theme>
    ratio?: number
}

const NumberedImages = (p: NumberedImagesProps) => {
    return <Stack sx={[{ flexWrap: 'nowrap', flexDirection: 'row' }, ...(Array.isArray(p.sx) ? p.sx : [p.sx])]}>
        {p.images.map((img: any, idx: number) =>
            <Stack key={idx} sx={p.imageBoxSx} position="relative">
                <ImageNumber ratio={p.ratio} number={p.start + idx} />
                {img}
            </Stack>
        )}
    </Stack>
}

interface Props {
    visible: boolean
    onClose: () => void
    pureExplain?: boolean
}

const ExplainToken = (p: Props) => {
    const uiContext = useContext(UiContext)
    const appContext = useContext(AppContext)
    const appDispatchContext = useContext(AppDispatchContext)
    const [currentSlide, setCurrentSlide] = useState(0)
    const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({ 
        slideChanged(slider) {
            setCurrentSlide(slider.track.details.rel)
        },
        created(slider) {
            setCurrentSlide(0)
        }
    })
    const [switchToContributionMode] = useMutation(SWITCH_TO_CONTRIBUTION_MODE)
    const [switchStatus, setSwitchStatus] = useState<DataLoadState<undefined>>(initial(false))
    const theme = useTheme()
    const sm = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
    const md = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
    const numberOfSlides = (appContext.account?.willingToContribute || p.pureExplain) ? 4 : 5

    let ratio = 1
    if(sm) {
        ratio = 1/2
    } else if(md) {
        ratio = 3/4
    }

    return <Dialog open={p.visible} onClose={p.onClose} fullWidth maxWidth="md" fullScreen={sm}>
        <Stack alignItems="flex-end">
            <IconButton onClick={p.onClose}>
                <Close width="25px" fill={theme.palette.primary.contrastText} />
            </IconButton>
        </Stack>
        <Stack direction="row" ref={sliderRef} className="keen-slider">
            <Slide title={uiContext.i18n.translator("howItWorksStep1Title")} sx={{ gap: '1rem' }}>
                <Typography variant="body1" color="contrastText">{uiContext.i18n.translator('weNeedToGrow')}</Typography>
                <Typography variant="body1" color="contrastText">{uiContext.i18n.translator('chickenOrEgg')}</Typography>
                <Stack sx={theme => ({ 
                    margin: 'auto', width: '500px',
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
                <Typography variant="body1" color="contrastText">{uiContext.i18n.translator('freeResources')}</Typography>
                <NumberedImages ratio={ratio} start={1} images={[<Microwave height="100%"/>,<Cap height="100%"/>]} sx={{ 
                    margin: 'auto', gap: '2rem'
                }} imageBoxSx={theme => ({ 
                    height: '200px',
                    [theme.breakpoints.down('md')]: {
                        height: '150px'
                    },
                    [theme.breakpoints.down('sm')]: {
                        height: '75px'
                    }
                })}/>
                <Stack margin="auto">
                    <Unlock height="3rem" width="3rem" fill={theme.palette.primary.contrastText}/>
                </Stack>
            </Slide>
            <Slide title={uiContext.i18n.translator("howItWorksStep3Title")} sx={{ gap: '3rem' }}>
                <Stack>
                    <Typography variant="body1" color="contrastText">{uiContext.i18n.translator('needContribution')}</Typography>
                    <Typography variant="body1" color="contrastText">{uiContext.i18n.translator('resourceConsumption')}</Typography>
                </ Stack>
                <Stack position="relative" margin="auto" sx={theme => ({
                    width: '400px',
                    [theme.breakpoints.down('md')]: {
                        width: '300px'
                    },
                    [theme.breakpoints.down('sm')]: {
                        width: '200px'
                    }
                })}>
                    {[3, 4, 5].map((val, idx) => <ImageNumber ratio={ratio} key={idx} number={val} sx={theme => ({
                        left: `${(idx * 50)-10}px`,
                        top: `-${40 * ratio}px`,
                        [theme.breakpoints.down('md')]: {
                            left: `${(idx * 37.5)-10}px`,
                        },
                        [theme.breakpoints.down('sm')]: {
                            left: `${(idx * 25)-10}px`,
                        }
                    })}/>)}
                    <ConsumeTokens width="100%"/>
                </Stack>
            </Slide>
            <Slide title={uiContext.i18n.translator("howItWorksStep4Title")} sx={{ gap: '1rem' }}>
                <Typography variant="body1" color="contrastText">{uiContext.i18n.translator('earnTokens')}</Typography>
                {[uiContext.i18n.translator('newResource'), uiContext.i18n.translator('nicePic'), uiContext.i18n.translator('completeProfile'), uiContext.i18n.translator('exchangeResourcesAgainsTokens'), '...'].map((text, idx) => 
                    <Stack key={idx} direction="row" gap="1rem" alignItems="center">
                        <Stack direction="row">
                            <Check fill="#4BB543" width="40" />
                            <Tokens width="40" />
                        </Stack>
                        <Typography variant="body1" color="contrastText">{text}</Typography>
                    </Stack>
                )}
            </Slide>
            { !appContext.account?.willingToContribute && !p.pureExplain && <Slide title={uiContext.i18n.translator("howItWorksStep5Title")} sx={{ gap: '1rem' }}>
                <Typography variant="body1" color="contrastText">
                    <span>{uiContext.i18n.translator('youAlreadyHave') + ' '}</span> 
                    <span style={{ fontWeight: 'bolder', fontSize: '1.5rem' }}>{appContext.account?.amountOfTokens}</span>
                    <span> Topes</span>
                </Typography>
                <Feedback severity="error" detail={switchStatus.error?.detail} 
                    message={switchStatus.error?.message} visible={!!switchStatus.error} onClose={() => setSwitchStatus(initial(false))} />
                <LoadingButton variant="contained" color="primary" onClick={async () => {
                    setSwitchStatus(initial(true))
                    try {
                        await switchToContributionMode()
                        appDispatchContext({ type: AppReducerActionType.UpdateAccount, payload: { ...appContext.account, ...{ willingToContribute: true } } })
                        setSwitchStatus(fromData(undefined))
                        p.onClose()
                    } catch(e) {
                        setSwitchStatus(fromError(e, uiContext.i18n.translator('requestError')))
                    }
                }}>{uiContext.i18n.translator('becomeContributorButton')}</LoadingButton>
            </Slide> }
        </Stack>
        <Stack direction="row" justifyContent="space-between">
            <IconButton sx={{ visibility: currentSlide === 0 ? 'hidden': 'inherit', transform: 'scaleX(-1)' }} onClick={() => instanceRef.current?.prev()}>
                <Arrow width="30px" fill={theme.palette.primary.contrastText} />
            </IconButton>
            <IconButton sx={{ visibility: currentSlide === numberOfSlides - 1 ? 'hidden': 'inherit' }} onClick={() => instanceRef.current?.next()}>
                <Arrow width="30px" fill={theme.palette.primary.contrastText} />
            </IconButton>
        </Stack>
    </Dialog>
}

export default ExplainToken