import { LoadingButton } from "@mui/lab"
import 'keen-slider/keen-slider.min.css'
import { Typography, Divider, IconButton, Stack, useTheme, Theme, SxProps, Button } from "@mui/material"
import Campaign from "@/app/img/campaign.svg"
import Airdrop from "@/app/img/airdrop.svg"
import MoneyIn from "@/app/img/money-in.svg"
import Arrow from '@/app/img/fleche.svg'
import TimeUp from '@/app/img/time-up.svg'
import dayjs from "dayjs"
import { PriceTag } from "../misc"
import LoadedZone from "../scaffold/LoadedZone"
import { PropsWithChildren, useContext, useState } from "react"
import { UiContext } from "../scaffold/UiContextProvider"
import { useKeenSlider } from "keen-slider/react"
import { useMutation } from "@apollo/client"
import { SET_ACCOUNT_KNOW_ABOUT_CAMPAIGNS } from "./ExplainCampaignDialog"
import useActiveCampaign from "@/lib/useActiveCampaign"
import { fonts } from "@/theme"
import { getCommonConfig } from "@/config"

const GeneralInfoButtons = () => {
    const uiContext = useContext(UiContext)
    return <Stack gap="0.5rem" alignItems="center">
        <Button variant="text" href={`${window.location.protocol}//${window.location.host}/campaign`}>{uiContext.i18n.translator('infoOnCampaigns')}</Button>
        <Button variant="contained" href={`${window.location.protocol}//${window.location.host}/webapp/${getCommonConfig().mainVersion}`}>{uiContext.i18n.translator('seeItInAction')}</Button>
    </Stack>
}

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
        <Typography color="primary" variant="h2" textAlign="center" sx={{ textTransform: 'uppercase' }}>{p.title}</Typography>
        <Stack sx={p.sx}>
            { p.children }
        </Stack>
    </Stack>
</Stack>

const ExplainCampaign = (p: { onClose?: () => void }) => {
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
    const { activeCampaign } = useActiveCampaign()

    if(!activeCampaign.loading && !activeCampaign.error && !activeCampaign.data) {
        return <Stack>
            <Typography variant="h1" textAlign="center" alignItems="center" fontFamily={fonts.sugar.style.fontFamily} fontSize={30}>{uiContext.i18n.translator('noActiveCampaign')}</Typography>
            <GeneralInfoButtons />
        </Stack>
    }
    
    return <Stack>
        <LoadedZone loading={activeCampaign.loading} error={activeCampaign.error}>
            { activeCampaign.data && <Stack direction="row" ref={sliderRef} className="keen-slider">
                <Slide title={activeCampaign.data?.name} sx={{ gap: '1rem', alignItems: 'center' }}>
                    <Campaign />
                    {activeCampaign.data.description.split('\n').map((t, idx) => <Typography key={idx} variant="body1" textAlign="center" color="primary.contrastText">{t}</Typography>)}
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
                    <Airdrop />
                    <Stack direction="row" alignItems="center" gap={1}>
                        <PriceTag big value={activeCampaign.data.airdropAmount}/>
                        <Typography variant="body1" sx={{ fontWeight: 'bold' }} color="primary">{uiContext.i18n.translator('win')}</Typography>
                    </Stack>
                    <Typography variant="body1" textAlign="center" color="primary.contrastText">{uiContext.i18n.translator('create2ResourcesOnCampaign')}</Typography>
                    <Typography variant="subtitle1" color="primary.contrastText">{dayjs(activeCampaign.data.airdrop).format(uiContext.i18n.translator('dateTimeFormat'))}</Typography>
                    { dayjs(activeCampaign.data.airdrop) > dayjs(new Date()) ?
                        <Stack gap="2rem">
                            <Stack sx={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '1rem' }}>
                                <Typography variant="body1">{dayjs(activeCampaign.data.airdrop).fromNow()}</Typography>
                                <TimeUp height={35} width={35}/>
                            </Stack>
                            <Typography variant="body1" textAlign="center" color="primary.contrastText">{uiContext.i18n.translator('ensureAirdropEligibility')}</Typography>
                        </Stack>
                    :
                        <Stack sx={{ gap: '1rem', alignItems: 'center' }}>
                            <TimeUp height={65} width={65}/>
                            <Typography variant="body1">{uiContext.i18n.translator('didYouGetIt')}</Typography>
                        </Stack>
                    }
                </Slide>
                <Slide title={uiContext.i18n.translator("campaignSummaryTitle")} sx={{ gap: '1rem' }}>
                    <Stack alignItems="center">
                        <MoneyIn />
                    </Stack>
                    <Typography variant="body1" color="primary.contrastText">{uiContext.i18n.translator('campaignAllowYouto')}</Typography>
                    <Typography variant="body1" color="primary.contrastText">{uiContext.i18n.translator('forFree')}</Typography>
                    <Divider/>
                    { p.onClose ? 
                        <LoadingButton loading={settingCampaignBit} onClick={() => {
                            setAccountKnowsAboutCampaigns()
                            p.onClose!()
                        }}>{uiContext.i18n.translator('okButton')}</LoadingButton>
                        :
                        <GeneralInfoButtons />
                    }
                </Slide>
            </Stack> }
        </LoadedZone>
        <Stack direction="row" justifyContent="space-between" position='sticky' width="100%" bottom={0} right={0}>
            <IconButton sx={{ visibility: currentSlide === 0 ? 'hidden': 'inherit', transform: 'scaleX(-1)' }} onClick={() => instanceRef.current?.prev()}>
                <Arrow width="30px" fill={theme.palette.primary.contrastText} />
            </IconButton>
            <IconButton sx={{ visibility: currentSlide === 2 ? 'hidden': 'inherit' }} onClick={() => instanceRef.current?.next()}>
                <Arrow width="30px" fill={theme.palette.primary.contrastText} />
            </IconButton>
        </Stack>
    </Stack>
}

export default ExplainCampaign