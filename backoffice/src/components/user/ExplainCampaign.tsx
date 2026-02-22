import { LoadingButton } from "@mui/lab"
import { Typography, Divider, Stack, Button, Stepper, Step, StepContent, StepButton, useTheme } from "@mui/material"
import Campaign from '@/app/img/campaign.svg?react'
import Airdrop from '@/app/img/airdrop.svg?react'
import MoneyIn from '@/app/img/money-in.svg?react'
import TimeUp from '@/app/img/time-up.svg?react'
import MobileAppConnectIcon from '@/app/img/NOT_CONNECTED.svg?react'
import dayjs from "dayjs"
import { AppDownloadButtons, PriceTag } from "../misc"
import LoadedZone from "../scaffold/LoadedZone"
import { ReactNode, useContext, useEffect, useState } from "react"
import { UiContext } from "../scaffold/UiContextProvider"
import { useMutation } from "@apollo/client"
import { SET_ACCOUNT_KNOW_ABOUT_CAMPAIGNS } from "./ExplainCampaignDialog"
import useActiveCampaign from "@/lib/useActiveCampaign"
import { fonts } from "@/theme"
import { getCommonConfig } from "@/config"
import { t } from "i18next"
import { useRouter } from "next/navigation"

const OnboardingActions = () => {
    const uiContext = useContext(UiContext)
    const theme = useTheme()
    return <Stack gap="0.5rem" alignItems="flex-start">
        <Stack direction="row" gap="1rem">
            👉
            <Typography variant="subtitle1">{uiContext.i18n.translator('optionalInstallAppOnboardingStep')}</Typography>
        </Stack>

        <AppDownloadButtons size={60} />
        <Typography variant="body1">{uiContext.i18n.translator('webVersionAvailable')}</Typography>
        <Stack direction="row" gap="1rem">
            👉
            <Typography variant="subtitle1">{uiContext.i18n.translator('createAnAccountOnboardingStep')}</Typography>
        </Stack>
        <Stack direction="row" gap="2rem" alignItems="center">
            <Typography variant="body1">{uiContext.i18n.translator('findMobileConnectionIcon')}</Typography>
            <MobileAppConnectIcon fill={theme.palette.primary.contrastText} width="2rem" height="2rem" />
        </Stack>
        <Typography variant="body1">{uiContext.i18n.translator('or')}</Typography>
        <Button variant="outlined" target="_blank" href={`${window.location.protocol}//${window.location.host}/webapp/${getCommonConfig().mainVersion}/resources`}>
            {t(uiContext.i18n.translator('registerButtonCaption'))}
        </Button>
        <Stack direction="row" gap="1rem">
            👉
            <Typography variant="subtitle1">{uiContext.i18n.translator('createResourcesOnboardingStep')}</Typography>
        </Stack>
        <Typography variant="body1">{uiContext.i18n.translator('2resourcesBeforeAirdrop')}</Typography>
        <Stack direction="row" gap="1rem">
            👉
            <Typography variant="subtitle1">{uiContext.i18n.translator('getairdropOnboardingStep')}</Typography>
        </Stack>
        <Typography variant="body1">{uiContext.i18n.translator('getAirdropToImmediatelyBuy')}</Typography>
        {/* <Button variant="text" href={`${window.location.protocol}//${window.location.host}/campaign`}>{uiContext.i18n.translator('infoOnCampaigns')}</Button> */}
    </Stack>
}

interface StepInfo {
    stepLabel: string
    title: string
    content: ReactNode
}

const ExplainCampaign = (p: { onClose?: () => void, fullscreen?: boolean, explainOnly?: boolean }) => {
    const router = useRouter()
    const uiContext = useContext(UiContext)
    const [setAccountKnowsAboutCampaigns, { loading: settingCampaignBit }] = useMutation(SET_ACCOUNT_KNOW_ABOUT_CAMPAIGNS)
    const [ steps, setSteps ] = useState<StepInfo[]>([])
    const [currentStep, setCurrentStep] = useState(0)
    const [ visited, setVisited ] = useState([true, false, false, false])
    const { activeCampaign } = useActiveCampaign()

    if(!activeCampaign.loading && !activeCampaign.error && !activeCampaign.data) {
        return <Stack>
            <Typography variant="h1" textAlign="center" alignItems="center" fontFamily={fonts.sugar.style.fontFamily} fontSize={30}>{uiContext.i18n.translator('noActiveCampaign')}</Typography>
            <Button variant="contained" href={`${window.location.protocol}//${window.location.host}/webapp/${getCommonConfig().mainVersion}`}>{uiContext.i18n.translator('seeItInAction')}</Button>
        </Stack>
    }

    useEffect(() => {
        if(activeCampaign.data) {
            const steps = [
                { title: activeCampaign.data?.name, stepLabel: uiContext.i18n.translator("themeStepLabel"),
                    content: <>
                        <Campaign />
                        <Typography variant="body1" dangerouslySetInnerHTML={{ __html: activeCampaign.data.description }}/>
                        {/* {activeCampaign.data.description.split('\n').map((t, idx) => <Typography key={idx} variant="body1" textAlign="center" color="primary.contrastText">{t}</Typography>)} */}
                        <Divider sx={{ alignSelf: 'stretch' }}/>
                        <Typography variant="body1" textAlign="center" color="primary.contrastText">
                            {uiContext.i18n.translator('createResourcesInCampaignExplanation')}
                        </Typography>
                        <Typography variant="h5" textAlign="center" color="primary.contrastText">
                            {uiContext.i18n.translator('rewardsMultiplied', { multiplier: activeCampaign.data.resourceRewardsMultiplier })}
                        </Typography>
                    </>},
                { title: uiContext.i18n.translator("airdropTitle"), stepLabel: uiContext.i18n.translator("bonusStepLabel"),
                    content: <>
                        <Airdrop />
                        <Stack direction="row" alignItems="center" gap={1}>
                            <PriceTag big value={activeCampaign.data.airdropAmount}/>
                            <Typography variant="body1" sx={{ fontWeight: 'bold' }} color="primary">{uiContext.i18n.translator('win')}</Typography>
                        </Stack>
                        <Typography variant="body1" textAlign="center" color="primary.contrastText">{uiContext.i18n.translator('create2ResourcesOnCampaign')}</Typography>
                        <Stack direction="row" alignItems="center" gap="1rem">
                            <Typography variant="subtitle1" color="primary.contrastText">{dayjs(activeCampaign.data.airdrop).format(uiContext.i18n.translator('dateTimeFormat'))}</Typography>
                            <TimeUp height={35} width={35}/>
                        </Stack>
                        { dayjs(activeCampaign.data.airdrop) > dayjs(new Date()) ?
                            <Stack gap="2rem" alignItems="center">
                                <Typography variant="body1">{`(${dayjs(activeCampaign.data.airdrop).fromNow()})`}</Typography>
                                <Typography variant="body1" textAlign="center" color="primary.contrastText">{uiContext.i18n.translator('ensureAirdropEligibility')}</Typography>
                            </Stack>
                        :
                            <Stack sx={{ gap: '1rem', alignItems: 'center' }}>
                                <TimeUp height={65} width={65}/>
                                <Typography variant="body1">{uiContext.i18n.translator('didYouGetIt')}</Typography>
                            </Stack>
                        }
                    </>}
            ]

            if(!p.explainOnly) {
                steps.push({ title: uiContext.i18n.translator("onboardingInstructions"), stepLabel: uiContext.i18n.translator("onboardingStepLabel"),
                    content: <>
                        { p.onClose ? 
                            <LoadingButton variant="contained" loading={settingCampaignBit} onClick={async() => {
                                await setAccountKnowsAboutCampaigns()
                                p.onClose!()
                                router.push(`/webapp/${uiContext.version}/resources/new?campaign=1`)
                            }}>{uiContext.i18n.translator('addResourceButton')}</LoadingButton>
                            :
                            <OnboardingActions />
                        }
                    </>})
            }

            steps.push({ title: uiContext.i18n.translator("campaignSummaryTitle"), stepLabel: uiContext.i18n.translator("summaryStepLabel"),
                content: <>
                    <Stack alignItems="center">
                        <MoneyIn />
                    </Stack>
                    <Typography variant="body1" color="primary.contrastText">{uiContext.i18n.translator('campaignAllowYouto')}</Typography>
                    <Typography variant="body1" color="primary.contrastText">{uiContext.i18n.translator('forFree')}</Typography>
                    <Button target="_blank" href={`/campaign`} variant="text">{uiContext.i18n.translator('moreInfoOnCampaigns')}</Button>
                </>})
            setSteps(steps)
        }
    }, [activeCampaign.data])
    
    return <LoadedZone loading={activeCampaign.loading} error={activeCampaign.error} containerStyle={theme => ({
        margin: 'auto',
        paddingBottom: '2rem',
        width: '800px',
        [theme.breakpoints.down('lg')]: {
            width: '500px',
            padding: '1rem'
        },
        [theme.breakpoints.down('sm')]: {
            width: '100%',
            padding: '0.25rem'
        }
    })}>
    { activeCampaign.data && <Stepper nonLinear orientation="vertical" activeStep={currentStep}>
            {steps.map((step, idx) => <Step key={idx} completed={ visited[idx] }>
                <StepButton onClick={() => {
                    setCurrentStep(idx)
                    setVisited(prev => {
                        prev[idx] = true
                        return [...prev]
                    })
                }}>{step.stepLabel}</StepButton>
                <StepContent>
                    <Stack sx={{
                        margin: '0 auto',
                        overflow: 'auto',
                        alignItems: 'center'
                    }}>
                        {/* { idx != 0  && <Button onClick={() => setCurrentStep(idx-1)} variant="outlined" startIcon={<UpIcon />}>
                            {uiContext.i18n.translator('previousButtonLabel')}
                        </Button> } */}
                        <Typography color="primary" variant="h2" textAlign="center" sx={{ textTransform: 'uppercase' }}>{step.title}</Typography>
                        <Stack sx={{ gap: '1rem', alignItems: 'center' }}>
                            { step.content }
                        </Stack>
                        {/* { idx != steps.length - 1  && <Button onClick={() => setCurrentStep(idx+1)} sx={{ marginTop: '1rem' }} variant="outlined" startIcon={<DownIcon />}>
                            {uiContext.i18n.translator('nextButtonLabel')}
                        </Button> } */}
                    </Stack>
                </StepContent>
            </Step>)}
        </Stepper>}
    </LoadedZone>
}

export default ExplainCampaign