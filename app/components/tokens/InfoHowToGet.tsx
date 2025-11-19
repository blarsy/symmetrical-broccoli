import { t } from "@/i18n"
import React, { useContext, useEffect, useState } from "react"
import { ActivityIndicator, Card, Icon, Text } from "react-native-paper"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import Images from "@/Images"
import { AppAlertDispatchContext, AppAlertReducerActionType, AppContext } from "../AppContextProvider"
import { useNavigation } from "@react-navigation/native"
import { View } from "react-native"
import { gql, useQuery } from "@apollo/client"
import { GraphQlLib } from "@/lib/backendFacade"
import BareIconButton from "../layout/BareIconButton"
import { ADD_LINK_REWARD, ADD_LOCATION_REWARD, ADD_LOGO_REWARD, ADD_RESOURCE_PICTURE_REWARD, CREATE_RESOURCE_REWARD, SWITCH_TO_CONTRIBUTION_MODE_REWARD } from "@/lib/settings"
import useActiveCampaign from "@/lib/useActiveCampaign"
import dayjs from "dayjs"
import ContributeDialog from "./ContributeDialog"

interface OneTimeTaskProps {
    text: string
    checked: boolean
    reward: number
    onPress: () => void
    loading?: boolean
}

const OneTimeTask = ({ text, checked, onPress, loading, reward }: OneTimeTaskProps) => <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Text variant="headlineMedium" style={{ flex: 1 }}>{text}</Text>
    { loading ? <ActivityIndicator color={primaryColor} size={35} /> :
        checked ? <Images.Check fill="#4BB543" height={35} width={35} />
        :
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="headlineMedium" style={{ minWidth: 35 }}>+ {reward}</Text>
            <BareIconButton Image="arrow-right-bold" size={35} style={{ margin: 0, backgroundColor: '#fff', borderRadius: 17, borderWidth: 2, borderColor: '#000' }} onPress={onPress} />
        </View>}
</View>

interface ReccurringTaskProps {
    text: string
    remainingAmount: number
    remainingText: string
    reward: number
    onPress: () => void
    loading?: boolean
}

const ReccurringTask = ({ text, remainingAmount, remainingText, loading, reward, onPress }: ReccurringTaskProps) => {
    let content
    if(loading){ 
        content = [
            <Text key="txt" variant="headlineMedium" style={{ flex: 1 }}>{text}</Text>,
            <ActivityIndicator key="spinner" color={primaryColor} size={35} />
        ] 
    } else {
        content = [
            <View key="txt" style={{ flex: 1, flexDirection: 'column' }}>
                <Text variant="headlineMedium">{text}</Text>
                { remainingAmount > 0 && <Text variant="bodySmall">{`${remainingAmount} ${remainingText}`}</Text> }
            </ View>
        ]
        if(remainingAmount === 0) content.push(<Images.Check key="check" fill="#4BB543" height={35} width={35} />)
        else content.push(<View key="action" style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text variant="headlineMedium" style={{ minWidth: 35 }}>+ {reward}</Text>
            <BareIconButton Image="arrow-right-bold" size={35} style={{ margin: 0, backgroundColor: '#fff', borderRadius: 17, borderWidth: 2, borderColor: '#000' }} onPress={onPress} />
        </ View>)
    }
    return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{content}</View>
}

interface PermanentTaskProps {
    text: string
    reward: number
    onPress: () => void
}

const PermanentTask = ({ text, reward, onPress }: PermanentTaskProps) => <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Text variant="headlineMedium" style={{ flex: 1 }}>{text}</Text>
    <Text variant="headlineMedium" style={{ minWidth: 35 }}>+ {reward}</Text>
    <BareIconButton Image="arrow-right-bold" size={35} style={{ margin: 0, backgroundColor: '#fff', borderRadius: 17, borderWidth: 2, borderColor: '#000' }} onPress={onPress} />
</View>

interface AirdropTaskProps {
    loading: boolean
    airdrop: Date
    numberOfResources: number
    reward: number
    onPress: () => void
}

const AirdropTask = (p: AirdropTaskProps) => {
    const text = t('howToGet_beElligibleForAirdrop', { date: dayjs(p.airdrop).format(t('dateTimeFormat')) })

    let content
    if(p.loading){ 
        content = [
            <Text key="txt" variant="headlineMedium" style={{ flex: 1 }}>{text}</Text>,
            <ActivityIndicator key="spinner" color={primaryColor} size={35} />
        ] 
    } else {
        content = [
            <View key="txt" style={{ flex: 1, flexDirection: 'column' }}>
                <Text variant="headlineMedium">{text}</Text>
                { p.numberOfResources < 2 && <Text variant="bodySmall" style={{ fontStyle: 'italic' }}>{`${2 - p.numberOfResources} ${t('resourcesInCampaigntoGo')}`}</Text> }
                { p.numberOfResources >= 2 && <Text variant="bodySmall" style={{ fontStyle: 'italic' }}>{`${p.numberOfResources} ${t('resourcesInCampaign')}`}</Text> }
            </ View>,
            <View key="action" style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text variant="headlineMedium" style={{ minWidth: 35 }}>+ {p.reward}</Text>
                { p.numberOfResources >= 2 ? <View key="check" style={{ flexDirection: 'row', position: 'relative' }}>
                    <Icon source="alarm" color="#4BB543" size={35} />
                    <View style= {{ position: 'absolute', right: -10, bottom: -10 }}>
                        <Icon source="emoticon-happy-outline" color={primaryColor} size={30 * (35/50)}/>
                    </View>
                </View> : <BareIconButton Image="arrow-right-bold" size={35} style={{ margin: 0, backgroundColor: '#fff', borderRadius: 17, borderWidth: 2, borderColor: '#000' }} onPress={p.onPress} /> }
            </ View>
        ]
    }
    return <View style={{ flexDirection: 'row', alignItems: 'center' }}>{content}</View>
}

export const GET_RESOURCES_WITHOUT_PIC = gql`query GetMyResourcesWithoutPicture {
    getMyResourcesWithoutPicture {
      nodes {
        id
      }
    }
  }`

const NUMBER_ACTIVE_RESOURCES_ON_ACTIVE_CAMPAIGN = gql`query GetNumberOfActiveResourcesOnActiveCampaign {
  getNumberOfActiveResourcesOnActiveCampaign
}`

const InfoHowToGet = ({ navigation }: { navigation?: any }) => {
    const appContext = useContext(AppContext)
    const appAlertDispatch = useContext(AppAlertDispatchContext)
    if(!navigation)
        navigation = useNavigation()
    const {data, loading, error, refetch} = useQuery(GraphQlLib.queries.GET_ACCOUNT, { variables: { id: appContext.account?.id } })
    const { data: resWithoutPics, loading: resWithoutPicsLoading, error: resWithoutPicsError } = useQuery(GET_RESOURCES_WITHOUT_PIC)
    const { data: resOnCampaign, loading: resOnCampaignLoading, error: resOnCampaignError } = useQuery(NUMBER_ACTIVE_RESOURCES_ON_ACTIVE_CAMPAIGN)
    const { activeCampaign } = useActiveCampaign()
    const [explainingToken, setExplainingToken] = useState(false)

    useEffect(() => {
        if(error || resWithoutPicsError) appAlertDispatch({ type: AppAlertReducerActionType.DisplayNotification, payload: { error: (error || resWithoutPicsError) as Error } })
    }, [error])

    useEffect(() => {
        if(appContext.account) refetch()
    }, [appContext.account])

    return <Card style={{ backgroundColor: lightPrimaryColor, margin: 10, padding: 10 }}
        contentStyle={{ gap: 15 }}>
        <OneTimeTask text={t('howToGet_switchToContributionMode')} 
            checked={!!appContext.account?.willingToContribute} 
            onPress={() => setExplainingToken(true)} reward={SWITCH_TO_CONTRIBUTION_MODE_REWARD}/>
        <OneTimeTask text={t('howToGet_addLogo')} 
            checked={!!appContext.account?.avatarPublicId} 
            onPress={() => navigation.navigate('main')} reward={ADD_LOGO_REWARD}/>
        <OneTimeTask text={t('howToGet_addLocation')} 
            checked={data && data.getAccountPublicInfo?.locationByLocationId?.address} 
            loading={loading} onPress={() => navigation.navigate('main')} reward={ADD_LOCATION_REWARD}/>
        <OneTimeTask text={t('howToGet_addLink')} 
            checked={data && data.getAccountPublicInfo?.accountsLinksByAccountId?.nodes && data.getAccountPublicInfo.accountsLinksByAccountId.nodes.length > 0} 
            loading={loading} onPress={() => navigation.navigate('main')} reward={ADD_LINK_REWARD}/>
        <ReccurringTask text={t('howToGet_addPictureToResource')} 
            remainingAmount={resWithoutPics?.getMyResourcesWithoutPicture?.nodes.length} 
            remainingText={ t('resourcesWithoutPic') } reward={ADD_RESOURCE_PICTURE_REWARD} loading={resWithoutPicsLoading} 
            onPress={() => navigation.navigate('board', { screen: 'resource', params: { screen: 'resources' } })} />
        <PermanentTask text={t('howToGet_addNewResource')} 
            reward={CREATE_RESOURCE_REWARD}
            onPress={() => navigation.navigate('board', { screen: 'resource', params: { screen: 'resources' } })} />
        { activeCampaign.loading && <ActivityIndicator color={primaryColor} /> }
        { activeCampaign.data && !activeCampaign.data.airdropDone && 
            <AirdropTask airdrop={activeCampaign.data.airdrop} loading={activeCampaign.loading} 
                onPress={() => navigation.navigate('board', { screen: 'resource', params: { screen: 'resources' } })}
                reward={activeCampaign.data.airdropAmount} numberOfResources={resOnCampaign?.getNumberOfActiveResourcesOnActiveCampaign} /> }
        { activeCampaign.data && <PermanentTask key="rewardMultiplier" 
            reward={CREATE_RESOURCE_REWARD * activeCampaign.data.resourceRewardsMultiplier} 
            text={t('howToGet_createResourcesOnCampaign')} onPress={() => navigation.navigate('board', { screen: 'resource', params: { screen: 'resources' } })} />}
        <ContributeDialog visible={explainingToken} onDismiss={() => setExplainingToken(false)} title={t('contributionExplainationDialogTitle')} />
    </ Card>
}
export default InfoHowToGet

//Create new resource (10 on 3rd like) -> need to promote
//(mark resource gisted or exchanged, confirmed by both parties)
//(Signal abuse (3), when confirmed by staff)