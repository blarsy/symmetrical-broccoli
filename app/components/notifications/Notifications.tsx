import { gql, useLazyQuery, useMutation } from "@apollo/client"
import React, { useContext, useEffect, useState } from "react"
import { ScrollView } from "react-native-gesture-handler"
import LoadedList from "../LoadedList"
import ResponsiveListItem from "../ResponsiveListItem"
import { Image, View } from "react-native"
import { Icon, Text } from "react-native-paper"
import { primaryColor } from "../layout/constants"
import { RouteProps, userFriendlyTime } from "@/lib/utils"
import DataLoadState from "@/lib/DataLoadState"
import { t } from "@/i18n"
import { urlFromPublicId } from "@/lib/images"
import { NavigationHelpers, ParamListBase, useNavigation } from "@react-navigation/native"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"

interface NotificationData {
    id: number
    read: boolean
    created: Date
    headline1: string
    headline2: string
    text: string
    image?: string
    onPress: () => void
}

const GET_NOTIFICATIONS = gql`query MyNotifications {
    myNotifications {
      nodes {
        created
        data
        read
        id
      }
    }
}`

const GET_RESOURCES = gql`query GetResources($resourceIds: [Int]) {
    getResources(resourceIds: $resourceIds) {
      nodes {
        id
        title
        resourcesImagesByResourceId(first: 1) {
          nodes {
            imageByImageId {
              publicId
            }
          }
        }
        created
        accountByAccountId {
          name
        }
      }
    }
}`

const SET_NOTIFICATION_READ = gql`mutation setNotificationRead($notificationId: Int) {
    setNotificationRead(input: {notificationId: $notificationId}) {
      integer
    }
  }`

// const SET_NOTIFICATIONS_READ = gql`mutation setNotificationsRead {
//     setNotificationsRead(input: {}) {
//       integer
//     }
//   }`

const useNotifications = ( navigation: NavigationHelpers<ParamListBase> ) => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const [getNotifications, { data, loading, error, refetch }] = useLazyQuery(GET_NOTIFICATIONS, { fetchPolicy: 'network-only' })
    const [notificationData, setNotificationData] = useState<DataLoadState<NotificationData[]> & { refetch: () => void }>({ loading: true, data: undefined, error: undefined, refetch  })
    const [getResources, { error: resourcesError }]= useLazyQuery(GET_RESOURCES, { fetchPolicy: "network-only" })
    const [setNotificationRead] = useMutation(SET_NOTIFICATION_READ)

    const refetchResourcesAndNotifications = () => {
        getResources().then(() => {
            refetch()
        })
    }

    const makeNotificationsData = (notificationsAboutResource: any, resourcesData: any) => {
        const result = [] as NotificationData[]

        const resources = {} as {
            [resourceId: number]: any
        }

        resourcesData.getResources.nodes.forEach((rawRes: any) => resources[rawRes.id] = rawRes)

        notificationsAboutResource.forEach((rawNotification: any) => {
            if(rawNotification.data.resource_id) {
                result.push({ 
                    id: rawNotification.id,
                    created: rawNotification.created, 
                    headline1: t('newResourceFrom_notificationHeadline'),
                    headline2: resources[rawNotification.data.resource_id].accountByAccountId.name,
                    read: rawNotification.read,
                    text: resources[rawNotification.data.resource_id].title,
                    image: resources[rawNotification.data.resource_id].resourcesImagesByResourceId.nodes.length > 0 ? 
                        urlFromPublicId(resources[rawNotification.data.resource_id].resourcesImagesByResourceId.nodes[0].imageByImageId.publicId) : 
                        undefined,
                    onPress: async () => {
                        setNotificationRead({ variables: { notificationId: rawNotification.id } })
                        navigation.navigate('viewResource', { resourceId: rawNotification.data.resource_id })
                        setNotificationData(previous => ({ ...previous, ...{ data: previous.data!.map(notif => {
                            if (notif.id === rawNotification.id) {
                                return { ...notif, ...{ read: true } }
                            }
                            return notif
                        }) } }))
                        appDispatch({ type: AppReducerActionType.NotificationRead, payload: rawNotification.id })
                    }
                })
            } else {
                throw new Error(`Unexpected notification data type ${JSON.stringify(rawNotification.data)}`)
            }
        })

        return result
    }

    const load = async () => {
        if(data) {
            try {
                let newResourceNotifs: NotificationData[] = []
                const otherNotifs: NotificationData[] = []

                // notifications about new resources
                const notificationsAboutResource = data.myNotifications.nodes.filter((rawNotif: any) => rawNotif.data?.resource_id)
                const resIds = notificationsAboutResource.map((rawNotif: any) => rawNotif.data?.resource_id)

                if(resIds.length > 0) {
                    const resourcesData = await getResources({ variables: { resourceIds: resIds } })
                    newResourceNotifs = makeNotificationsData(notificationsAboutResource, resourcesData.data)
                } else {
                    setNotificationData({ loading: false, data: [], refetch: refetchResourcesAndNotifications })
                }

                // other notifications (for the moment, only 'welcome new user' notification)
                data.myNotifications.nodes.forEach((rawNotification: any) => {
                    if(rawNotification.data.info === 'COMPLETE_PROFILE') {
                        otherNotifs.push({
                            id: rawNotification.id,
                            created: rawNotification.created, 
                            headline1: t('welcomeNotificationHeadline'),
                            headline2: t('completeProcessNotificationHeadline'),
                            read: rawNotification.read,
                            text: t('completeProcessNotificationDetails'),
                            image: undefined,
                            onPress: async () => {
                                navigation.navigate('profile')
                                setNotificationData(previous => ({ ...previous, ...{ data: previous.data!.map(notif => {
                                    if (notif.id === rawNotification.id) {
                                        return { ...notif, ...{ read: true } }
                                    }
                                    return notif
                                }) } }))
                                appDispatch({ type: AppReducerActionType.NotificationRead, payload: rawNotification.id })
                            }
                        })
                    }
                })

                const allNotifications = newResourceNotifs.concat(otherNotifs)
                allNotifications.sort((a, b) => a.created == b.created ? 0 : (a.created > b.created ? 1 : -1))

                setNotificationData({ loading: false, refetch: refetchResourcesAndNotifications, data: allNotifications })
            } catch(e) {
                setNotificationData({ loading: false, error: e as Error, refetch: refetchResourcesAndNotifications })
            }
        } else {
            if(appContext.account){
                getNotifications()
            } else {
                setNotificationData({ loading, error: error || resourcesError, refetch: refetchResourcesAndNotifications })
            }
        }
    }

    useEffect(() => {
        load()
    }, [data, error, resourcesError, appContext.account])

    return notificationData
}

export default ({ navigation }: RouteProps) => {
    const appContext = useContext(AppContext)
    const nativeNavigation = useNavigation()
    const appDispatch = useContext(AppDispatchContext)
    const { data, loading, error, refetch } = useNotifications(navigation)
    //const [setNotificationsRead] = useMutation(SET_NOTIFICATIONS_READ)

    useEffect(() => {
        nativeNavigation.addListener('focus', () => {
            appDispatch({ type: AppReducerActionType.SetNewNotificationHandler, payload: { handler: refetch }})
        })
        nativeNavigation.addListener('blur', () => appDispatch({ type: AppReducerActionType.SetNewNotificationHandler, payload: { handler: undefined } }))
        return () => {
            appDispatch({ type: AppReducerActionType.SetNewNotificationHandler, payload: { handler: undefined } })
        }
    }, [])

    return <ScrollView testID="notifications">
        { appContext.account ?
            <LoadedList loading={loading} error={error} data={data} displayItem={(notif, idx) => <ResponsiveListItem style={{ paddingLeft: 5, paddingRight: !notif.read? 4 : 24, borderBottomColor: '#CCC', borderBottomWidth: 1 }} 
                    left={() =>
                        notif.image ? <Image style={{ width: 70, height: 70, borderRadius: 10 }} source={{ uri: notif.image }} /> : <Icon size={70} source="creation" />
                    } key={idx} onPress={notif.onPress}
                    right={p => <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end' }}>
                            <Text variant="bodySmall" style={{ color: primaryColor, fontWeight: !notif.read ? 'bold' : 'normal' }}>{ userFriendlyTime(notif.created) }</Text>
                            { !notif.read && <Icon testID={`notifications:${notif.id}:Unread`} size={20} color={primaryColor} source="circle" /> }
                        </View>}
                    title={() => <View style={{ flexDirection: 'column', paddingBottom: 10 }}>
                        <Text testID={`notifications:${notif.id}:Headline1`} variant="bodySmall" style={{ fontWeight: 'normal' }}>{ notif.headline1 }</Text>
                        <Text testID={`notifications:${notif.id}:HeadLine2`} variant="bodySmall" style={{ fontWeight: 'normal' }}>{ notif.headline2 }</Text>
                    </View>} description={<Text testID={`notifications:${notif.id}:Text`} variant="headlineMedium" style={{ color: primaryColor, fontWeight: !notif.read ? 'bold' : 'normal' }}>{notif.text}</Text>} />} />:
            <Text variant="labelLarge" style={{ textAlign: 'center', padding: 10 }}>{t('PleaseConnectLabel')}</Text>
        }
    </ScrollView>
}