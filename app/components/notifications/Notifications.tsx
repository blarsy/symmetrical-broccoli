import { gql, useLazyQuery, useMutation } from "@apollo/client"
import React, { useContext, useEffect, useState } from "react"
import LoadedList from "../LoadedList"
import ResponsiveListItem from "../ResponsiveListItem"
import { Image, View } from "react-native"
import { Icon, Text } from "react-native-paper"
import { primaryColor } from "../layout/constants"
import { RouteProps, userFriendlyTime } from "@/lib/utils"
import DataLoadState from "@/lib/DataLoadState"
import { t } from "@/i18n"
import { NavigationHelpers, ParamListBase, useNavigation } from "@react-navigation/native"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import ResourceImageWithCreator from "../ResourceImageWithAuthor"
import { AvatarIconAccountInfo } from "../mainViews/AccountAvatar"
import { fromServerGraphResource, Resource } from "@/lib/schema"

interface NotificationData {
    id: number
    read: boolean
    created: Date
    headline1: string
    headline2: string
    text: string
    image?: string | { resource: Resource, account: AvatarIconAccountInfo }
    onPress: () => void
}

interface NotificationPage {
    endCursor?: string,
    data: NotificationData[]
}

export const GET_NOTIFICATIONS = gql`query MyNotifications($first: Int, $after: Cursor) {
    myNotifications(first: $first, after: $after) {
      edges {
        node {
          created
          data
          id
          read
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }`

export const GET_RESOURCES = gql`query GetResources($resourceIds: [Int]) {
    getResources(resourceIds: $resourceIds) {
      nodes {
        accountByAccountId {
            email
            id
            name
            imageByAvatarImageId {
                publicId
            }
        }
        canBeDelivered
        canBeExchanged
        canBeGifted
        canBeTakenAway
        description
        id
        isProduct
        isService
        expiration
        title
        resourcesResourceCategoriesByResourceId {
            nodes {
                resourceCategoryCode
            }
        }
        resourcesImagesByResourceId {
            nodes {
                imageByImageId {
                publicId
                }
            }
        }
        locationBySpecificLocationId {
            address
            latitude
            longitude
            id
        }
        suspended
        paidUntil
        created
        deleted
        price
      }
    }
}`

const SET_NOTIFICATION_READ = gql`mutation setNotificationRead($notificationId: Int) {
    setNotificationRead(input: {notificationId: $notificationId}) {
      integer
    }
  }`

const NOTIFICATIONS_PAGE_SIZE = 20

const useNotifications = ( navigation: NavigationHelpers<ParamListBase> ) => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const [getNotifications, { refetch }] = useLazyQuery(GET_NOTIFICATIONS, { fetchPolicy: 'network-only' })
    const refetchResourcesAndNotifications = () => {
        getResources().then(() => {
            refetch()
        })
    }
    
    const [notificationData, setNotificationData] = useState<DataLoadState<NotificationPage>>({ loading: true, data: undefined, error: undefined })
    const loadEarlier = async() => {
        if(notificationData.data?.endCursor) {
            try {
                const resNotifs = await getNotifications({ variables: { first: NOTIFICATIONS_PAGE_SIZE, after: notificationData.data?.endCursor } })
                const allNotifs = await getNotificationDataFromRaw(resNotifs)
                setNotificationData(prev => ({ loading: false, data: { ...allNotifs, ...{ data: [...prev.data!.data, ...allNotifs.data] }} }))
            } catch(e) {
                setNotificationData({ loading: false, error: e as Error, data: notificationData.data })
                throw e
            }
        }
    }
    const [getResources]= useLazyQuery(GET_RESOURCES, { fetchPolicy: "network-only" })
    const [setNotificationRead] = useMutation(SET_NOTIFICATION_READ)


    const makeNotificationsData = (notificationsAboutResource: any, resourcesData: any) => {
        const result = [] as NotificationData[]

        const resources = {} as {
            [resourceId: number]: any
        }

        resourcesData.getResources.nodes.forEach((rawRes: any) => resources[rawRes.id] = rawRes)
        
        notificationsAboutResource.forEach((rawNotification: any) => {
            if(rawNotification.node.data.resource_id) {
                const resource = fromServerGraphResource(resources[rawNotification.node.data.resource_id], appContext.categories.data!)
                result.push({ 
                    id: rawNotification.node.id,
                    created: rawNotification.node.created, 
                    headline1: t('newResourceFrom_notificationHeadline'),
                    headline2: resources[rawNotification.node.data.resource_id].accountByAccountId.name,
                    read: rawNotification.node.read,
                    text: resources[rawNotification.node.data.resource_id].title,
                    image: { resource, account: { id: resource.account!.id, name: resource.account!.name, avatarImageUrl: resource.account!.avatarImageUrl } },
                    onPress: async () => {
                        setNotificationRead({ variables: { notificationId: rawNotification.node.id } })
                        navigation.navigate('viewResource', { resourceId: rawNotification.node.data.resource_id })
                        setNotificationData(previous => ({ ...previous, ...{ data: { endCursor: previous.data?.endCursor, data: previous.data!.data.map(notif => {
                            if (notif.id === rawNotification.node.id) {
                                return { ...notif, ...{ read: true } }
                            }
                            return notif
                        }) } } }))
                        appDispatch({ type: AppReducerActionType.NotificationRead, payload: rawNotification.node.id })
                    }
                })
            } else {
                throw new Error(`Unexpected notification data type ${JSON.stringify(rawNotification.node.data)}`)
            }
        })

        return result
    }

    const getNotificationDataFromRaw = async (rawNotifications: any): Promise<NotificationPage> => {
        let newResourceNotifs: NotificationData[] = []
        const otherNotifs: NotificationData[] = []
        const notificationsAboutResource = rawNotifications.data.myNotifications.edges.filter((rawNotif: any) => rawNotif.node.data?.resource_id)
        const resIds = notificationsAboutResource.map((rawNotif: any) => rawNotif.node.data?.resource_id)

        if(resIds.length > 0) {
            const resourcesData = await getResources({ variables: { resourceIds: resIds } })
            newResourceNotifs = makeNotificationsData(notificationsAboutResource, resourcesData.data)
        } else {
            setNotificationData({ loading: false, data: undefined })
        }

        // other notifications
        rawNotifications.data.myNotifications.edges.forEach((rawNotification: any) => {
            switch(rawNotification.node.data.info) {
                case 'COMPLETE_PROFILE':
                    otherNotifs.push({
                        id: rawNotification.node.id,
                        created: rawNotification.node.created, 
                        headline1: t('welcomeNotificationHeadline'),
                        headline2: t('completeProcessNotificationHeadline'),
                        read: rawNotification.node.read,
                        text: t('completeProcessNotificationDetails'),
                        image: undefined,
                        onPress: async () => {
                            setNotificationRead({ variables: { notificationId: rawNotification.node.id } })
                            navigation.navigate('profile')
                            setNotificationData(previous => ({ ...previous, ...{ data: { endCursor: previous.data?.endCursor, data: previous.data!.data.map(notif => {
                                if (notif.id === rawNotification.node.id) {
                                    return { ...notif, ...{ read: true } }
                                }
                                return notif
                            }) } } }))
                            appDispatch({ type: AppReducerActionType.NotificationRead, payload: rawNotification.node.id })
                        }
                    })
                    break
                case 'SOME_RESOURCES_SUSPENDED':
                    otherNotifs.push({
                        id: rawNotification.node.id,
                        created: rawNotification.node.created, 
                        headline1: t('resourcesSuspendedNotificationHeadline'),
                        headline2: t('checkTokensNotificationHeadline'),
                        read: rawNotification.node.read,
                        text: t('checkTokensNotificationDetails'),
                        image: undefined,
                        onPress: async () => {
                            setNotificationRead({ variables: { notificationId: rawNotification.node.id } })
                            navigation.navigate('resource', {
                                screen: 'resources'
                            })
                            setNotificationData(previous => ({ ...previous, ...{ data: { endCursor: previous.data?.endCursor, data: previous.data!.data.map(notif => {
                                if (notif.id === rawNotification.node.id) {
                                    return { ...notif, ...{ read: true } }
                                }
                                return notif
                            }) } } }))
                            appDispatch({ type: AppReducerActionType.NotificationRead, payload: rawNotification.node.id })
                        }
                    })
                    break
                case 'WARNING_LOW_TOKEN_AMOUNT':
                    otherNotifs.push({
                        id: rawNotification.node.id,
                        created: rawNotification.node.created, 
                        headline1: t('lowAmountOfTokenNotificationHeadline'),
                        headline2: t('lowAmountOfTokenNotificationHeadline2'),
                        read: rawNotification.node.read,
                        text: t('lowAmountOfTokenNotificationDetails'),
                        image: undefined,
                        onPress: async () => {
                            setNotificationRead({ variables: { notificationId: rawNotification.node.id } })
                            navigation.navigate('profile', {
                                screen: 'tokens'
                            })
                            setNotificationData(previous => ({ ...previous, ...{ data: { endCursor: previous.data?.endCursor, data: previous.data!.data.map(notif => {
                                if (notif.id === rawNotification.node.id) {
                                    return { ...notif, ...{ read: true } }
                                }
                                return notif
                            }) } } }))
                            appDispatch({ type: AppReducerActionType.NotificationRead, payload: rawNotification.node.id })
                        }
                    })
                    break
                case 'TOKENS_RECEIVED':
                    otherNotifs.push({
                        id: rawNotification.node.id,
                        created: rawNotification.node.created, 
                        headline1: t('tokensReceivedHeadline1'),
                        headline2: t('tokensReceivedHeadline2'),
                        read: rawNotification.node.read,
                        text: t('tokensReceivedDetails', { fromAccount: rawNotification.node.data.fromAccount, amountReceived: rawNotification.node.data.amountReceived }),
                        image: undefined,
                        onPress: async () => {
                            setNotificationRead({ variables: { notificationId: rawNotification.node.id } })
                            navigation.navigate('profile', {
                                screen: 'tokens',
                                params: {
                                    showHistory: true
                                }
                            })
                            setNotificationData(previous => ({ ...previous, ...{ data: { endCursor: previous.data?.endCursor, data: previous.data!.data.map(notif => {
                                if (notif.id === rawNotification.node.id) {
                                    return { ...notif, ...{ read: true } }
                                }
                                return notif
                            }) } } }))
                            appDispatch({ type: AppReducerActionType.NotificationRead, payload: rawNotification.node.id })
                        }
                    })
                    break
                case 'TOKENS_SENT':
                    otherNotifs.push({
                        id: rawNotification.node.id,
                        created: rawNotification.node.created, 
                        headline1: t('tokensSentHeadline1'),
                        headline2: t('tokensSentHeadline2'),
                        read: rawNotification.node.read,
                        text: t('tokensSentDetails', { toAccount: rawNotification.node.data.toAccount, amountSent: rawNotification.node.data.amountSent }),
                        image: undefined,
                        onPress: async () => {
                            setNotificationRead({ variables: { notificationId: rawNotification.node.id } })
                            navigation.navigate('profile', {
                                screen: 'tokens',
                                params: {
                                    showHistory: true
                                }
                            })
                            setNotificationData(previous => ({ ...previous, ...{ data: { endCursor: previous.data?.endCursor, data: previous.data!.data.map(notif => {
                                if (notif.id === rawNotification.node.id) {
                                    return { ...notif, ...{ read: true } }
                                }
                                return notif
                            }) } } }))
                            appDispatch({ type: AppReducerActionType.NotificationRead, payload: rawNotification.node.id })
                        }
                    })
                    break
                case 'WELCOME_TOKEN_USER':
                    otherNotifs.push({
                        id: rawNotification.node.id,
                        created: rawNotification.node.created, 
                        headline1: t('welcomeTokenUserHeadline1'),
                        headline2: t('welcomeTokenUserHeadline2'),
                        read: rawNotification.node.read,
                        text: t('welcomeTokenUserDetails'),
                        image: undefined,
                        onPress: async () => {
                            setNotificationRead({ variables: { notificationId: rawNotification.node.id } })
                            navigation.navigate('profile', {
                                screen: 'tokens'
                            })
                            setNotificationData(previous => ({ ...previous, ...{ data: { endCursor: previous.data?.endCursor, data: previous.data!.data.map(notif => {
                                if (notif.id === rawNotification.node.id) {
                                    return { ...notif, ...{ read: true } }
                                }
                                return notif
                            }) } } }))
                            appDispatch({ type: AppReducerActionType.NotificationRead, payload: rawNotification.node.id })
                        }
                    })
                    break
            }
        })

        const allNotifications = newResourceNotifs.concat(otherNotifs)
        allNotifications.sort((a, b) => a.created == b.created ? 0 : (a.created < b.created ? 1 : -1))
        
        return { 
            endCursor: rawNotifications.data.myNotifications.pageInfo.hasNextPage ? rawNotifications.data.myNotifications.pageInfo.endCursor : '',
            data: allNotifications
        }
    }

    const load = async () => {
        try {
            const resNotifs = await getNotifications({ variables: { first: NOTIFICATIONS_PAGE_SIZE } })
            const notifs = await getNotificationDataFromRaw(resNotifs)
            setNotificationData({ loading: false, data: notifs })
        } catch(e) {
            setNotificationData(prev => ({ loading: false, error: e as Error, data: prev.data }))
        }
    }

    useEffect(() => {
        if(appContext.account){
            load()
        }
    }, [appContext.account])

    return { ...notificationData, loadEarlier, refetch: refetchResourcesAndNotifications }
}

const NotificationImage = ({ image } : { image: string | {
    resource: Resource;
    account: AvatarIconAccountInfo;
} | undefined }) => {
    if(typeof image === 'string') {
        return <Image style={{ width: 70, height: 70, borderRadius: 10 }} source={{ uri: image }} />
    } else if (!image) {
        return <Icon size={70} source="creation" />
    } else {
        return <ResourceImageWithCreator size={70} resource={image.resource} authorInfo={image.account} onAccountPress={() => {}} />
    }
}

export default ({ navigation }: RouteProps) => {
    const appContext = useContext(AppContext)
    const nativeNavigation = useNavigation()
    const appDispatch = useContext(AppDispatchContext)
    const { data, loading, loadEarlier, error, refetch } = useNotifications(navigation)
    
    useEffect(() => {
        nativeNavigation.addListener('focus', () => {
            appDispatch({ type: AppReducerActionType.SetNewNotificationHandler, payload: { handler: refetch }})
        })
        nativeNavigation.addListener('blur', () => appDispatch({ type: AppReducerActionType.SetNewNotificationHandler, payload: { handler: undefined } }))
        return () => {
            appDispatch({ type: AppReducerActionType.SetNewNotificationHandler, payload: { handler: undefined } })
        }
    }, [])


    return <View testID="notifications">
        { appContext.account ?
            <LoadedList loading={loading} error={error} data={data?.data} 
            loadEarlier={loadEarlier}
            displayItem={(notif, idx) => {
                return <ResponsiveListItem style={{ paddingLeft: 5, paddingRight: !notif.read? 4 : 24, borderBottomColor: '#CCC', borderBottomWidth: 1 }} 
                left={() => <NotificationImage image={notif.image} />}
                key={idx} onPress={notif.onPress}
                right={p => <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                        <Text variant="bodySmall" style={{ color: primaryColor, fontWeight: !notif.read ? 'bold' : 'normal' }}>{ userFriendlyTime(notif.created) }</Text>
                        { !notif.read && <Icon testID={`notifications:${notif.id}:Unread`} size={20} color={primaryColor} source="circle" /> }
                    </View>}
                title={() => <View style={{ flexDirection: 'column', paddingBottom: 10 }}>
                    <Text testID={`notifications:${notif.id}:Headline1`} variant="bodySmall" style={{ fontWeight: 'normal' }}>{ notif.headline1 }</Text>
                    <Text testID={`notifications:${notif.id}:HeadLine2`} variant="bodySmall" style={{ fontWeight: 'normal' }}>{ notif.headline2 }</Text>
                </View>} description={<Text testID={`notifications:${notif.id}:Text`} 
                    variant="headlineMedium" style={{ color: primaryColor, fontWeight: !notif.read ? 'bold' : 'normal' }}>
                    {notif.text}
                </Text>} />
            }} />:
            <Text variant="labelLarge" style={{ textAlign: 'center', padding: 10 }}>{t('PleaseConnectLabel')}</Text>
        }
    </View>
}