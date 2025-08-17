import React, { useContext, useEffect } from "react"
import { gql, useQuery } from "@apollo/client"
import { ADD_LINK_REWARD, ADD_LOCATION_REWARD, ADD_LOGO_REWARD, ADD_RESOURCE_PICTURE_REWARD, CREATE_RESOURCE_REWARD, SWITCH_TO_CONTRIBUTION_MODE_REWARD } from "@/lib/constants"
import { CircularProgress, IconButton, Stack, Typography } from "@mui/material"
import Check from '@/app/img/CHECK.svg'
import ArrowForward from '@mui/icons-material/ArrowForward'
import { AppContext } from "../scaffold/AppContextProvider"
import LoadedZone from "../scaffold/LoadedZone"
import { UiContext } from "../scaffold/UiContextProvider"
import { useRouter } from "next/navigation"

interface OneTimeTaskProps {
    text: string
    checked: boolean
    reward: number
    onClick: () => void
    loading?: boolean
}

const OneTimeTask = ({ text, checked, onClick, loading, reward }: OneTimeTaskProps) => <Stack direction="row" gap="1rem">
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
}

const ReccurringTask = ({ text, remainingAmount, remainingText, loading, reward, onClick }: ReccurringTaskProps) => {
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
        if(remainingAmount === 0) content.push(<Check key="check" fill="#4BB543"  width="2rem" />)
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

export const GET_RESOURCES_WITHOUT_PIC = gql`query GetMyResourcesWithoutPicture {
    getMyResourcesWithoutPicture {
      nodes {
        id
      }
    }
  }`

const GET_ACCOUNT = gql`query Account {
    me {
        email
        name
        id
        resourcesByAccountId(orderBy: CREATED_DESC) {
        nodes {
            id
            canBeGifted
            canBeExchanged
            title
            deleted
            expiration
            suspended
            paidUntil
            resourcesImagesByResourceId {
            nodes {
                imageByImageId {
                publicId
                }
            }
            }
            resourcesResourceCategoriesByResourceId {
            nodes {
                resourceCategoryCode
            }
            }
            accountByAccountId {
            id
            }
        }
        }
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

const EarningTokens = ({ version }: { version: string }) => {
    const appContext = useContext(AppContext)
    const uiContext = useContext(UiContext)
    const router = useRouter()

    const {data, loading, error, refetch} = useQuery(GET_ACCOUNT)
    const { data: resWithoutPics, loading: resWithoutPicsLoading, error: resWithoutPicsError } = useQuery(GET_RESOURCES_WITHOUT_PIC)
    const t = uiContext.i18n.translator
    useEffect(() => {
        if(appContext.account) refetch()
    }, [appContext.account])

    return <LoadedZone loading={loading || resWithoutPicsLoading} error={error || resWithoutPicsError}>
        <OneTimeTask text={t('howToGet_switchToContributionMode')} 
            checked={true} 
            onClick={() => {}} reward={SWITCH_TO_CONTRIBUTION_MODE_REWARD}/>
        <OneTimeTask text={t('howToGet_addLogo')} 
            checked={!!appContext.account?.avatarPublicId} 
            onClick={() => router.push(`/webapp/${version}/profile`)} reward={ADD_LOGO_REWARD}/>
        <OneTimeTask text={t('howToGet_addLocation')} 
            checked={data && data.me?.locationByLocationId?.address} 
            loading={loading} onClick={() => router.push(`/webapp/${version}/profile`)} reward={ADD_LOCATION_REWARD}/>
        <OneTimeTask text={t('howToGet_addLink')} 
            checked={data && data.me?.accountsLinksByAccountId?.nodes && data.me.accountsLinksByAccountId.nodes.length > 0} 
            loading={loading} onClick={() => router.push(`/webapp/${version}/profile`)} reward={ADD_LINK_REWARD}/>
        <ReccurringTask text={t('howToGet_addPictureToResource')} 
            remainingAmount={resWithoutPics?.getMyResourcesWithoutPicture?.nodes.length} 
            remainingText={ t('resourcesWithoutPic') } reward={ADD_RESOURCE_PICTURE_REWARD} loading={resWithoutPicsLoading} 
            onClick={() => router.push(`/webapp/${version}/resources`)} />
        <PermanentTask text={t('howToGet_addNewResource')} 
            reward={CREATE_RESOURCE_REWARD}
            onClick={() => router.push(`/webapp/${version}/resources`)} />
    </LoadedZone>
}
export default EarningTokens

//Create new resource (10 on 3rd like) -> need to promote
//(mark resource gisted or exchanged, confirmed by both parties)
//(Signal abuse (3), when confirmed by staff)