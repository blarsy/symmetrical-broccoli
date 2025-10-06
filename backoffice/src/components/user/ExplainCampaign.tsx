import { Dialog, Stack, SxProps, Theme, Typography, useTheme, useMediaQuery, IconButton, Divider } from "@mui/material"
import React, { PropsWithChildren, useContext, useState } from 'react'
import 'keen-slider/keen-slider.min.css'
import { useKeenSlider } from 'keen-slider/react'
import { UiContext } from "../scaffold/UiContextProvider"
import BurnhornIcon from '@mui/icons-material/Campaign'
import Arrow from '@/app/img/fleche.svg'
import Close from '@/app/img/CROSS.svg'
import { gql, useMutation } from "@apollo/client"
import { LoadingButton } from "@mui/lab"
import useActiveCampaign from "@/lib/useActiveCampaign"
import LoadedZone from "../scaffold/LoadedZone"
import dayjs from "dayjs"
import { PriceTag } from "../misc"

interface SlideProps extends PropsWithChildren {
    title: string
    sx?: SxProps<Theme>
}

export const SET_ACCOUNT_KNOW_ABOUT_CAMPAIGNS = gql`mutation SetAccountKnowsAboutCampaigns {
  setAccountKnowsAboutCampaigns(input: {}) {
    integer
  }
}`

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

const ExplainCampaign = (p: Props) => {
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
    const [setAccountKnowsAboutCampaigns, { loading: settingCampaignBit }] = useMutation(SET_ACCOUNT_KNOW_ABOUT_CAMPAIGNS)
    const theme = useTheme()
    const sm = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
    const md = useMediaQuery((theme: Theme) => theme.breakpoints.down('md'))
    const { activeCampaign } = useActiveCampaign()

    return <Dialog open={p.visible} onClose={p.onClose} fullWidth maxWidth="md" fullScreen={sm}>
        <Stack alignItems="flex-end">
            <IconButton onClick={p.onClose}>
                <Close width="25px" fill={theme.palette.primary.contrastText} />
            </IconButton>
        </Stack>
        <LoadedZone loading={activeCampaign.loading} error={activeCampaign.error}>
            { activeCampaign.data && <Stack direction="row" ref={sliderRef} className="keen-slider">
                <Slide title={activeCampaign.data?.name} sx={{ gap: '1rem', alignItems: 'center' }}>
                    <BurnhornIcon fontSize="large" />
                    <Typography variant="body1" textAlign="center" color="primary.contrastText">{activeCampaign.data.description}</Typography>
                    <Divider sx={{ alignSelf: 'stretch' }}/>
                    <Typography variant="body1" textAlign="center" color="primary.contrastText">
                        {uiContext.i18n.translator('createResourcesInCampaignExplanation')}
                    </Typography>
                    <Typography variant="h5" textAlign="center" color="primary.contrastText">
                        {uiContext.i18n.translator('rewardsMultiplied', { multiplier: activeCampaign.data.resourceRewardsMultiplier })}
                    </Typography>
                    <Typography variant="body1" color="primary.contrastText">{uiContext.i18n.translator('thatsNotAll')}</Typography>
                </Slide>
                <Slide title={uiContext.i18n.translator("airdropTitle")} sx={{ gap: '1rem', alignItems: 'center' }}>
                    <Stack direction="row" alignItems="center" gap={1}>
                        <PriceTag big value={activeCampaign.data.airdropAmount}/>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }} color="primary">{uiContext.i18n.translator('win')}</Typography>
                    </Stack>
                    <Typography variant="body1" textAlign="center" color="primary.contrastText">{uiContext.i18n.translator('create2ResourcesOnCampaign')}</Typography>
                    <Typography variant="subtitle1" color="primary.contrastText">{dayjs(activeCampaign.data.airdrop).format(uiContext.i18n.translator('dateTimeFormat'))}</Typography>
                    <Typography variant="body1" textAlign="center" color="primary.contrastText">{uiContext.i18n.translator('ensureAirdropEligibility')}</Typography>
                </Slide>
                <Slide title={uiContext.i18n.translator("campaignSummaryTitle")} sx={{ gap: '1rem' }}>
                    <Typography variant="body1" color="primary.contrastText">{uiContext.i18n.translator('campaignAllowYouto')}</Typography>
                    <Typography variant="body1" color="primary.contrastText">{uiContext.i18n.translator('forFree')}</Typography>
                    <Divider/>
                    <LoadingButton loading={settingCampaignBit} onClick={() => setAccountKnowsAboutCampaigns()}>{uiContext.i18n.translator('okButton')}</LoadingButton>
                </Slide>
            </Stack> }
        </LoadedZone>
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

export default ExplainCampaign