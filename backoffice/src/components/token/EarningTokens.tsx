import React, { useContext, useEffect, useState } from "react"
import { gql, useQuery } from "@apollo/client"
import { ADD_LINK_REWARD, ADD_LOCATION_REWARD, ADD_LOGO_REWARD, ADD_RESOURCE_PICTURE_REWARD, CREATE_RESOURCE_REWARD, SWITCH_TO_CONTRIBUTION_MODE_REWARD } from "@/lib/constants"
import { CircularProgress, IconButton, Stack, Typography } from "@mui/material"
import Check from '@/app/img/CHECK.svg'
import Smiley from '@mui/icons-material/SentimentSatisfiedAlt'
import AlarmIcon from '@mui/icons-material/Alarm'
import ArrowForward from '@mui/icons-material/ArrowForward'
import { AppContext } from "../scaffold/AppContextProvider"
import LoadedZone from "../scaffold/LoadedZone"
import { UiContext } from "../scaffold/UiContextProvider"
import { useRouter } from "next/navigation"
import useActiveCampaign from "@/lib/useActiveCampaign"
import dayjs from "dayjs"
import ExplainToken from "./ExplainToken"

interface OneTimeTaskProps {
    text: string
    checked: boolean
    reward: number
    onClick: () => void
    loading?: boolean
}

const OneTimeTask = ({ text, checked, onClick, loading, reward }: OneTimeTaskProps) => <Stack direction="row" gap="1rem" alignItems="center">
    <Typography variant="body1" sx={theme => ({ flex: 1, color: theme.palette.primary.contrastText })}>{text}</Typography>
    { loading ? <CircularProgress color="primary" /> :
        checked ? <Check fill="#4BB543" width="2rem"/>
        :
        <Stack direction="row" alignItems="center">
            <Typography variant="body1" sx={theme => ({ color: theme.palette.primary.contrastText })}>+ {reward}</Typography>
            <IconButton onClick={onClick}>
                <ArrowForward />
            </IconButton>
        </Stack>}
</Stack>

interface ReccurringTaskProps {
    text: string
    remainingAmount: number
    remainingText: string
    reward: number
    onClick: () => void
    loading?: boolean
    zeroRemainingMeansDone?: boolean
}

const ReccurringTask = ({ text, remainingAmount, remainingText, loading, reward, onClick, zeroRemainingMeansDone,  }: ReccurringTaskProps) => {
    let content
    if(loading){ 
        content = [
            <Typography key="txt" variant="body1" sx={theme => ({ flex: 1, color: theme.palette.primary.contrastText })}>{text}</Typography>,
            <CircularProgress key="spinner" color="primary" />
        ] 
    } else {
        content = [
            <Stack key="txt" flex="1">
                <Typography key="txt" variant="body1" sx={theme => ({ flex: 1, color: theme.palette.primary.contrastText })}>{text}</Typography>
                { remainingAmount > 0 && <Typography variant="body1" sx={theme => ({ color: theme.palette.primary.contrastText })}>{`${remainingAmount} ${remainingText}`}</Typography> }
            </ Stack>
        ]
        if(remainingAmount === 0 && zeroRemainingMeansDone) content.push(<Check key="check" fill="#4BB543"  width="2rem" />)
        else content.push(<Stack direction="row" key="action" alignItems="center">
            <Typography variant="body1" sx={theme => ({ color: theme.palette.primary.contrastText })}>+ {reward}</Typography>
            <IconButton onClick={onClick}>
                <ArrowForward />
            </IconButton>
        </ Stack>)
    }
    return <Stack direction="row" alignItems="center" gap="1rem">{content}</Stack>
}

interface PermanentTaskProps {
    text: string
    reward: number
    onClick: () => void
}

const PermanentTask = ({ text, reward, onClick }: PermanentTaskProps) => <Stack direction="row" alignItems="center" gap="1rem">
    <Typography variant="body1" sx={theme => ({ flex: 1, color: theme.palette.primary.contrastText })}>{text}</Typography>
    <Stack direction="row" alignItems="center">
        <Typography variant="body1" sx={theme => ({ color: theme.palette.primary.contrastText })}>+ {reward}</Typography>
        <IconButton onClick={onClick}>
            <ArrowForward />
        </IconButton>
    </Stack>
</Stack>

interface AirdropTaskProps {
    loading: boolean
    airdrop: Date
    numberOfResources: number
    reward: number
    onClick: () => void
}

const AirdropTask = (p: AirdropTaskProps) => {
    const uiContext = useContext(UiContext)
    const t = uiContext.i18n.translator
    const text = t('howToGet_beElligibleForAirdrop', { date: dayjs(p.airdrop).format(t('dateTimeFormat')) })

    let content
    if(p.loading){ 
        content = [
            <Typography key="txt" variant="body1" sx={theme => ({ flex: 1, color: theme.palette.primary.contrastText })}>{text}</Typography>,
            <CircularProgress key="spinner" color="primary" />
        ] 
    } else {
        content = [
            <Stack key="txt" flex="1">
                <Typography key="txt" variant="body1" sx={theme => ({ flex: 1, color: theme.palette.primary.contrastText })}>{text}</Typography>
                { p.numberOfResources < 2 && <Typography variant="body1" sx={theme => ({ color: theme.palette.primary.contrastText, fontStyle: 'italic' })}>{`${2 - p.numberOfResources} ${t('resourcesInCampaigntoGo')}`}</Typography> }
                { p.numberOfResources >= 2 && <Typography variant="body1" sx={theme => ({ color: theme.palette.primary.contrastText, fontStyle: 'italic' })}>{`${p.numberOfResources} ${t('resourcesInCampaign')}`}</Typography> }
            </ Stack>,
            <Stack direction="row" key="action" alignItems="center">
                { p.numberOfResources >= 2 && <Stack key="check" position="relative">
                    <AlarmIcon color="success" sx={{ fontSize: 50 }} />
                    <Smiley color="warning" sx={{ fontSize: 30, position: 'absolute', right: -10, bottom: -10 }} />
                </Stack>}
                <Typography variant="body1" sx={theme => ({ color: theme.palette.primary.contrastText })}>+ {p.reward}</Typography>
                <IconButton onClick={p.onClick}>
                    <ArrowForward />
                </IconButton>
            </ Stack>
        ]
    }
    return <Stack direction="row" alignItems="center" gap="1rem">{content}</Stack>
}

export const GET_RESOURCES_WITHOUT_PIC = gql`query GetMyResourcesWithoutPicture {
    getMyResourcesWithoutPicture {
      nodes {
        id
      }
    }
  }`

export const GET_ACCOUNT = gql`query Account {
  me {
    email
    name
    id
    imageByAvatarImageId {
      publicId
    }
    accountsLinksByAccountId {
      nodes {
        id
        url
        label
        linkTypeByLinkTypeId {
          id
        }
      }
    }
    locationByLocationId {
      address
      id
      longitude
      latitude
    }
  }
}`

export const NUMBER_ACTIVE_RESOURCES_ON_ACTIVE_CAMPAIGN = gql`query GetNumberOfActiveResourcesOnActiveCampaign {
  getNumberOfActiveResourcesOnActiveCampaign
}`

const EarningTokens = ({ version }: { version: string }) => {
    const appContext = useContext(AppContext)
    const uiContext = useContext(UiContext)
    const router = useRouter()
    const { activeCampaign } = useActiveCampaign()
    const { data: resOnCampaign, loading: resOnCampaignLoading } = useQuery(NUMBER_ACTIVE_RESOURCES_ON_ACTIVE_CAMPAIGN)
    const [explainingToken, setExplainingToken] = useState(false)
    const {data, loading, error, refetch} = useQuery(GET_ACCOUNT)
    const { data: resWithoutPics, loading: resWithoutPicsLoading, error: resWithoutPicsError } = useQuery(GET_RESOURCES_WITHOUT_PIC)
    const t = uiContext.i18n.translator
    useEffect(() => {
        if(appContext.account) refetch()
    }, [appContext.account])

    return <LoadedZone loading={loading || resWithoutPicsLoading} error={error || resWithoutPicsError}>
        <OneTimeTask text={t('howToGet_switchToContributionMode')} 
            checked={!!appContext.account?.willingToContribute} 
            onClick={() => setExplainingToken(true)} reward={SWITCH_TO_CONTRIBUTION_MODE_REWARD}/>
        <OneTimeTask text={t('howToGet_addLogo')} 
            checked={!!appContext.account?.avatarPublicId} 
            onClick={() => router.push(`/webapp/${version}/profile`)} reward={ADD_LOGO_REWARD}/>
        <OneTimeTask text={t('howToGet_addLocation')} 
            checked={data && data.me?.locationByLocationId?.address} 
            loading={loading} onClick={() => router.push(`/webapp/${version}/profile`)} reward={ADD_LOCATION_REWARD}/>
        <OneTimeTask text={t('howToGet_addLink')} 
            checked={data && data.me?.accountsLinksByAccountId?.nodes && data.me.accountsLinksByAccountId.nodes.length > 0} 
            loading={loading} onClick={() => router.push(`/webapp/${version}/profile`)} reward={ADD_LINK_REWARD}/>
        <ReccurringTask text={t('howToGet_addPictureToResource')} zeroRemainingMeansDone={false}
            remainingAmount={resWithoutPics?.getMyResourcesWithoutPicture?.nodes.length} 
            remainingText={ t('resourcesWithoutPic') } reward={ADD_RESOURCE_PICTURE_REWARD} loading={resWithoutPicsLoading} 
            onClick={() => router.push(`/webapp/${version}/resources`)} />
        <PermanentTask text={t('howToGet_addNewResource')} 
            reward={CREATE_RESOURCE_REWARD}
            onClick={() => router.push(`/webapp/${version}/resources`)} />
        { activeCampaign.loading && <CircularProgress color="primary" /> }
        { activeCampaign.data && !activeCampaign.data.airdropDone && 
            <AirdropTask airdrop={activeCampaign.data.airdrop} loading={resOnCampaignLoading} reward={activeCampaign.data.airdropAmount}
                numberOfResources={resOnCampaign?.getNumberOfActiveResourcesOnActiveCampaign}
                onClick={() => router.push(`/webapp/${version}/resources`)} />}
        { activeCampaign.data && <PermanentTask key="rewardMultiplier" 
            reward={CREATE_RESOURCE_REWARD * activeCampaign.data.resourceRewardsMultiplier} 
            text={t('howToGet_createResourcesOnCampaign')} onClick={() => router.push(`/webapp/${version}/resources`)} />}
        <ExplainToken visible={explainingToken} onClose={() => setExplainingToken(false)} />
    </LoadedZone>
}
export default EarningTokens

//Create new resource (10 on 3rd like) -> need to promote
//(mark resource gisted or exchanged, confirmed by both parties)
//(Signal abuse (3), when confirmed by staff)