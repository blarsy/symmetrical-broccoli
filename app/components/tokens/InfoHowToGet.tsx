import { t } from "@/i18n"
import React, { useContext, useEffect } from "react"
import { ActivityIndicator, Card, Text } from "react-native-paper"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import Images from "@/Images"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import { useNavigation } from "@react-navigation/native"
import { View } from "react-native"
import { gql, useQuery } from "@apollo/client"
import { GraphQlLib } from "@/lib/backendFacade"
import BareIconButton from "../layout/BareIconButton"
import { ADD_LINK_REWARD, ADD_LOCATION_REWARD, ADD_LOGO_REWARD, ADD_RESOURCE_PICTURE_REWARD, CREATE_RESOURCE_REWARD, SWITCH_TO_CONTRIBUTION_MODE_REWARD } from "@/lib/settings"

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
            <BareIconButton Image="arrow-right" size={35} style={{ margin: 0 }} onPress={onPress} />
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
            <BareIconButton Image="arrow-right" size={35} onPress={onPress} style={{ margin: 0 }}/>
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
    <BareIconButton Image="arrow-right" size={35} onPress={onPress} style={{ margin: 0 }}/>
</View>

export const GET_RESOURCES_WITHOUT_PIC = gql`query GetMyResourcesWithoutPicture {
    getMyResourcesWithoutPicture {
      nodes {
        id
      }
    }
  }`

const InfoHowToGet = ({ navigation }: { navigation?: any }) => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    if(!navigation)
        navigation = useNavigation()
    const {data, loading, error, refetch} = useQuery(GraphQlLib.queries.GET_ACCOUNT, { variables: { id: appContext.account?.id } })
    const { data: resWithoutPics, loading: resWithoutPicsLoading, error: resWithoutPicsError } = useQuery(GET_RESOURCES_WITHOUT_PIC)

    useEffect(() => {
        if(error || resWithoutPicsError) appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: (error || resWithoutPicsError) as Error } })
    }, [error])

    useEffect(() => {
        if(appContext.account) refetch()
    }, [appContext.account])
    
    return <Card style={{ backgroundColor: lightPrimaryColor, margin: 10, padding: 10 }}
        contentStyle={{ gap: 15 }}>
        <OneTimeTask text={t('howToGet_switchToContributionMode')} 
            checked={true} 
            onPress={() => {}} reward={SWITCH_TO_CONTRIBUTION_MODE_REWARD}/>
        <OneTimeTask text={t('howToGet_addLogo')} 
            checked={!!appContext.account?.avatarPublicId} 
            onPress={() => navigation.navigate('main')} reward={ADD_LOGO_REWARD}/>
        <OneTimeTask text={t('howToGet_addLocation')} 
            checked={data && data.accountById?.locationByLocationId?.address} 
            loading={loading} onPress={() => navigation.navigate('publicInfo')} reward={ADD_LOCATION_REWARD}/>
        <OneTimeTask text={t('howToGet_addLink')} 
            checked={data && data.accountById?.accountsLinksByAccountId?.nodes && data.accountById.accountsLinksByAccountId.nodes.length > 0} 
            loading={loading} onPress={() => navigation.navigate('publicInfo')} reward={ADD_LINK_REWARD}/>
        <ReccurringTask text={t('howToGet_addPictureToResource')} 
            remainingAmount={resWithoutPics?.getMyResourcesWithoutPicture?.nodes.length} 
            remainingText={ t('resourcesWithoutPic') } reward={ADD_RESOURCE_PICTURE_REWARD} loading={resWithoutPicsLoading} 
            onPress={() => navigation.navigate('resources')} />
        <PermanentTask text={t('howToGet_addNewResource')} 
            reward={CREATE_RESOURCE_REWARD}
            onPress={() => navigation.navigate('resources')} />

    </ Card>
}
export default InfoHowToGet

//Create new resource (10 on 3rd like) -> need to promote
//(mark resource gisted or exchanged, confirmed by both parties)
//(Signal abuse (3), when confirmed by staff)