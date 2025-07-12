import { gql, useLazyQuery, useMutation } from "@apollo/client"
import { useContext, useEffect, useRef, useState } from "react"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../scaffold/AppContextProvider"
import { Link, Stack, Typography } from "@mui/material"
import { UiContext } from "../scaffold/UiContextProvider"
import { fromServerGraphResource, Resource } from "@/lib/schema"
import DataLoadState, { fromData } from "@/lib/DataLoadState"
import { useRouter } from "next/navigation"
import LoadedList from "../scaffold/LoadedList"
import ResourceImage from "../ResourceImage"
import NotificationsActive from '@mui/icons-material/NotificationsActive'
import { userFriendlyTime } from "@/lib/utils"
import useCategories from "@/lib/useCategories"

interface NotificationData {
    id: number
    read: boolean
    created: Date
    headline1: string
    headline2: string
    text: string
    image?: string | { resource: Resource, account: { id: number, name: string, avatarImageUrl?: string} }
    onClick: () => void
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
        subjectiveValue
      }
    }
}`

const SET_NOTIFICATION_READ = gql`mutation setNotificationRead($notificationId: Int) {
    setNotificationRead(input: {notificationId: $notificationId}) {
      integer
    }
  }`

const NOTIFICATIONS_PAGE_SIZE = 15

const useNotifications = (version: string) => {
    const appContext = useContext(AppContext)
    const uiContext = useContext(UiContext)
    useCategories()
    const appDispatch = useContext(AppDispatchContext)
    const [getNotifications, { refetch }] = useLazyQuery(GET_NOTIFICATIONS, { fetchPolicy: 'network-only' })
    const router = useRouter()
    const refetchResourcesAndNotifications = () => {
        getResources().then(() => {
            refetch()
        })
    }
    const t = uiContext.i18n.translator
    
    const [notificationData, setNotificationData] = useState<DataLoadState<NotificationPage>>({ loading: true, data: undefined, error: undefined })
    const [loadingEarlier, setLoadingEarlier] = useState(false)
    
    const loadEarlier = async() => {
        if(notificationData.data?.endCursor && !loadingEarlier) {
            try {
                setLoadingEarlier(true)
                const resNotifs = await getNotifications({ variables: { first: NOTIFICATIONS_PAGE_SIZE, after: notificationData.data?.endCursor } })
                const allNotifs = await getNotificationDataFromRaw(resNotifs)
                setNotificationData(prev => {
                    return { loading: false, data: { ...allNotifs, ...{ data: [...prev.data!.data, ...allNotifs.data] }}}
                })
            } catch(e) {
                setNotificationData({ loading: false, error: e as Error, data: notificationData.data })
                throw e
            } finally {
                setLoadingEarlier(false)
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
                const resource = fromServerGraphResource(resources[rawNotification.node.data.resource_id], uiContext.categories.data!)
                result.push({ 
                    id: rawNotification.node.id,
                    created: rawNotification.node.created, 
                    headline1: t('newResourceFrom_notificationHeadline'),
                    headline2: resources[rawNotification.node.data.resource_id].accountByAccountId.name,
                    read: rawNotification.node.read,
                    text: resources[rawNotification.node.data.resource_id].title,
                    image: { resource, account: { id: resource.account!.id, name: resource.account!.name, avatarImageUrl: resource.account!.avatarImageUrl } },
                    onClick: async () => {
                        setNotificationRead({ variables: { notificationId: rawNotification.node.id } })
                        router.push(`/webapp/${version}/view/${rawNotification.node.data.resource_id}`)
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
            console.log('{ loading: false, data: undefined }')
            setNotificationData({ loading: false, data: undefined })
        }

        // other notifications
        rawNotifications.data.myNotifications.edges.forEach((rawNotification: any) => {
            if(rawNotification.node.data.info === 'COMPLETE_PROFILE') {
                otherNotifs.push({
                    id: rawNotification.node.id,
                    created: rawNotification.node.created, 
                    headline1: t('welcomeNotificationHeadline'),
                    headline2: t('completeProcessNotificationHeadline'),
                    read: rawNotification.node.read,
                    text: t('completeProcessNotificationDetails'),
                    image: undefined,
                    onClick: async () => {
                        setNotificationRead({ variables: { notificationId: rawNotification.node.id } })
                        router.push(`/webapp/${version}/profile`)
                        setNotificationData(previous => ({ ...previous, ...{ data: { endCursor: previous.data?.endCursor, data: previous.data!.data.map(notif => {
                            if (notif.id === rawNotification.node.id) {
                                return { ...notif, ...{ read: true } }
                            }
                            return notif
                        }) } } }))
                        appDispatch({ type: AppReducerActionType.NotificationRead, payload: rawNotification.node.id })
                    }
                })
            } else if(rawNotification.node.data.info === 'SOME_RESOURCES_SUSPENDED') {
                otherNotifs.push({
                    id: rawNotification.node.id,
                    created: rawNotification.node.created, 
                    headline1: t('resourcesSuspendedNotificationHeadline'),
                    headline2: t('checkTokensNotificationHeadline'),
                    read: rawNotification.node.read,
                    text: t('checkTokensNotificationDetails'),
                    image: undefined,
                    onClick: async () => {
                        setNotificationRead({ variables: { notificationId: rawNotification.node.id } })
                        router.push(`/webapp/${version}/resources`)
                        setNotificationData(previous => ({ ...previous, ...{ data: { endCursor: previous.data?.endCursor, data: previous.data!.data.map(notif => {
                            if (notif.id === rawNotification.node.id) {
                                return { ...notif, ...{ read: true } }
                            }
                            return notif
                        }) } } }))
                        appDispatch({ type: AppReducerActionType.NotificationRead, payload: rawNotification.node.id })
                    }
                })
            } else if (rawNotification.node.data.info === 'WARNING_LOW_TOKEN_AMOUNT') {
                otherNotifs.push({
                    id: rawNotification.node.id,
                    created: rawNotification.node.created, 
                    headline1: t('lowAmountOfTokenNotificationHeadline'),
                    headline2: t('lowAmountOfTokenNotificationHeadline2'),
                    read: rawNotification.node.read,
                    text: t('lowAmountOfTokenNotificationDetails'),
                    image: undefined,
                    onClick: async () => {
                        setNotificationRead({ variables: { notificationId: rawNotification.node.id } })
                        router.push(`/webapp/${version}/profile/tokens`)
                        
                        setNotificationData(previous => ({ ...previous, ...{ data: { endCursor: previous.data?.endCursor, data: previous.data!.data.map(notif => {
                            if (notif.id === rawNotification.node.id) {
                                return { ...notif, ...{ read: true } }
                            }
                            return notif
                        }) } } }))
                        appDispatch({ type: AppReducerActionType.NotificationRead, payload: rawNotification.node.id })
                    }
                })
            } else if (rawNotification.node.data.info === 'TOKENS_RECEIVED') {
                otherNotifs.push({
                    id: rawNotification.node.id,
                    created: rawNotification.node.created, 
                    headline1: t('tokensReceivedHeadline1'),
                    headline2: t('tokensReceivedHeadline2'),
                    read: rawNotification.node.read,
                    text: t('tokensReceivedDetails', { fromAccount: rawNotification.node.data.fromAccount, amountReceived: rawNotification.node.data.amountReceived }),
                    image: undefined,
                    onClick: async () => {
                        setNotificationRead({ variables: { notificationId: rawNotification.node.id } })
                        router.push(`/webapp/${version}/profile/tokens`)
                        setNotificationData(previous => ({ ...previous, ...{ data: { endCursor: previous.data?.endCursor, data: previous.data!.data.map(notif => {
                            if (notif.id === rawNotification.node.id) {
                                return { ...notif, ...{ read: true } }
                            }
                            return notif
                        }) } } }))
                        appDispatch({ type: AppReducerActionType.NotificationRead, payload: rawNotification.node.id })
                    }
                })
            } else if (rawNotification.node.data.info === 'TOKENS_SENT') {
                otherNotifs.push({
                    id: rawNotification.node.id,
                    created: rawNotification.node.created, 
                    headline1: t('tokensSentHeadline1'),
                    headline2: t('tokensSentHeadline2'),
                    read: rawNotification.node.read,
                    text: t('tokensSentDetails', { toAccount: rawNotification.node.data.toAccount, amountSent: rawNotification.node.data.amountSent }),
                    image: undefined,
                    onClick: async () => {
                        setNotificationRead({ variables: { notificationId: rawNotification.node.id } })
                        router.push(`/webapp/${version}/profile/tokens`)
                        setNotificationData(previous => ({ ...previous, ...{ data: { endCursor: previous.data?.endCursor, data: previous.data!.data.map(notif => {
                            if (notif.id === rawNotification.node.id) {
                                return { ...notif, ...{ read: true } }
                            }
                            return notif
                        }) } } }))
                        appDispatch({ type: AppReducerActionType.NotificationRead, payload: rawNotification.node.id })
                    }
                })
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
            setNotificationData(fromData(notifs))
        }
        catch(e) {
            setNotificationData(prev => ({ loading: false, error: e as Error, data: prev.data }))
        }
    }

    useEffect(() => {
        if(appContext.account && uiContext.categories.data){
            load()
        }
    }, [appContext.account, uiContext.categories.data])

    return { ...notificationData, loadEarlier, refetch: refetchResourcesAndNotifications }
}

const NotificationImage = ({ image } : { image: string | {
    resource: Resource;
    account: { id: number, name: string, avatarImageUrl?: string };
} | undefined }) => {
    if(typeof image === 'string') {
        return <img style={{ width: 70, height: 70, borderRadius: 10 }} src={image} />
    } else if (!image) {
        return <NotificationsActive width={70} />
    } else {
        return <ResourceImage accountName={image.account.name} 
            accountImagePublicId={image.account.avatarImageUrl} 
            resourceImagePublicId={image.resource.images.length > 0 ? image.resource.images[0].publicId : undefined}  />
    }
}

const Notifications = ({ version }: { version: string }) => {
    const uiContext = useContext(UiContext)
    const appDispatch = useContext(AppDispatchContext)
    const { data, loading, loadEarlier, error, refetch } = useNotifications(version)
    const ref = useRef<HTMLDivElement>(null)

    const loadEarlierIfNotOverflowing = () => {
        if(ref && ref.current && ref.current.scrollHeight <= ref.current.clientHeight) {
            loadEarlier()
        }
    }
    
    useEffect(() => {
        appDispatch({ type: AppReducerActionType.SetNewNotificationHandler, payload: { handler: refetch }})
        
        return () => {
            appDispatch({ type: AppReducerActionType.SetNewNotificationHandler, payload: { handler: undefined } })
        }
    }, [])

    useEffect(() => {
        window.addEventListener('resize', loadEarlierIfNotOverflowing)
        return () => {
            window.removeEventListener('resize', loadEarlierIfNotOverflowing)
        }
    }, [loadEarlier])

    useEffect(() => {
        if(data && data.data) {
            loadEarlierIfNotOverflowing()
        }
    }, [data?.data])

    return <LoadedList ref={ref} loading={loading} error={error} items={data?.data || []} 
        containerStyle={theme => ({
            alignItems: 'center',
            overflow: 'auto'
        })} onBottom={() => {
            loadEarlier()
        }}
        renderItem={(notif: NotificationData) => {
            return <Link key={notif.id} onClick={notif.onClick} sx={{ textDecorationLine: 'none' }}>
                <Stack direction="row" gap="1rem" sx={{ cursor: 'pointer' }}>
                    <NotificationImage image={notif.image} />
                    <Stack>
                        <Typography variant="body1">{notif.headline1}</Typography>
                        <Typography variant="body1">{notif.headline2}</Typography>
                        <Typography variant="body1">{notif.text}</Typography>
                    </Stack>
                    <Typography variant="body1">{userFriendlyTime(notif.created, uiContext.i18n.translator('shortDateFormat'))}</Typography>
                </Stack>
            </Link>
        }} />
}

export default Notifications