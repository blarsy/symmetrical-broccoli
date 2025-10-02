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
import { makePxSize, ResponsivePhotoBox, screenSizesCoefficients } from "../misc"
import FiberManualRecord from '@mui/icons-material/FiberManualRecord'
import dayjs from "dayjs"

interface NotificationData {
    id: number
    read: boolean
    created: Date
    headline1: string
    headline2: string
    text: string
    image?: string | { resource: Resource, account: { id: number, name: string, avatarImagePublicId?: string} }
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
        price
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
        return getResources().then(() => {
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
                    return { loading: false, data: { ...allNotifs, ...{ data: [...prev.data?.data || [], ...allNotifs.data] }}}
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
                    image: { resource, account: { id: resource.account!.id, name: resource.account!.name, avatarImagePublicId: resource.account!.avatarImagePublicId } },
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

    const createOtherNotification = (headline1: string, headline2: string, details: string, url: string, rawNotification: any, image?: string): NotificationData => ({
        id: rawNotification.node.id,
        created: rawNotification.node.created, 
        headline1,
        headline2,
        read: rawNotification.node.read,
        text: details,
        image,
        onClick: async () => {
            setNotificationRead({ variables: { notificationId: rawNotification.node.id } })
            router.push(url)
            setNotificationData(previous => ({ ...previous, ...{ data: { endCursor: previous.data?.endCursor, data: previous.data!.data.map(notif => {
                if (notif.id === rawNotification.node.id) {
                    return { ...notif, ...{ read: true } }
                }
                return notif
            }) } } }))
            appDispatch({ type: AppReducerActionType.NotificationRead, payload: rawNotification.node.id })
        }
    })

    const getNotificationDataFromRaw = async (rawNotifications: any): Promise<NotificationPage> => {
        let newResourceNotifs: NotificationData[] = []
        const otherNotifs: NotificationData[] = []
        const notificationsAboutResource = rawNotifications.data.myNotifications.edges.filter((rawNotif: any) => rawNotif.node.data?.resource_id)
        const resIds = notificationsAboutResource.map((rawNotif: any) => rawNotif.node.data?.resource_id)

        if(resIds.length > 0) {
            const resourcesData = await getResources({ variables: { resourceIds: resIds } })
            newResourceNotifs = makeNotificationsData(notificationsAboutResource, resourcesData.data)
        }

        // other notifications
        rawNotifications.data.myNotifications.edges.forEach((rawNotification: any) => {
            switch(rawNotification.node.data.info) {
                case 'COMPLETE_PROFILE':
                    otherNotifs.push(
                        createOtherNotification(t('welcomeNotificationHeadline'), t('completeProcessNotificationHeadline'), 
                            t('completeProcessNotificationDetails'), `/webapp/${version}/profile`, rawNotification)
                        )
                    break
                case 'SOME_RESOURCES_SUSPENDED':
                    otherNotifs.push(
                        createOtherNotification(t('resourcesSuspendedNotificationHeadline'), t('checkTokensNotificationHeadline'), 
                            t('checkTokensNotificationDetails'), `/webapp/${version}/resources`, rawNotification)
                        )
                    break
                case 'WARNING_LOW_TOKEN_AMOUNT':
                    otherNotifs.push(
                        createOtherNotification(t('lowAmountOfTokenNotificationHeadline'), t('lowAmountOfTokenNotificationHeadline2'), 
                            t('lowAmountOfTokenNotificationDetails'), `/webapp/${version}/profile/tokens`, rawNotification)
                        )
                    break
                case 'TOKENS_RECEIVED':
                    otherNotifs.push(
                        createOtherNotification(t('tokensReceivedHeadline1'), t('tokensReceivedHeadline2'), 
                            t('tokensReceivedDetails', { fromAccount: rawNotification.node.data.fromAccount, amountReceived: rawNotification.node.data.amountReceived }), 
                            `/webapp/${version}/profile/tokens`, rawNotification)
                        )
                    break
                case 'TOKENS_SENT':
                    otherNotifs.push(
                        createOtherNotification(t('tokensSentHeadline1'), t('tokensSentHeadline2'), 
                            t('tokensSentDetails', { toAccount: rawNotification.node.data.toAccount, amountSent: rawNotification.node.data.amountSent }), 
                            `/webapp/${version}/profile/tokens`, rawNotification)
                        )
                    break
                case 'WELCOME_TOKEN_USER':
                    otherNotifs.push(
                        createOtherNotification(t('welcomeTokenUserHeadline1'), t('welcomeTokenUserHeadline2'), 
                            t('welcomeTokenUserDetails'), 
                            `/webapp/${version}/profile/tokens`, rawNotification)
                        )
                    break
                case 'BID_RECEIVED':
                    otherNotifs.push(
                         createOtherNotification(t('bidReceivedHeadline1'), t('bidReceivedHeadline2', { sender: rawNotification.node.data.receivedFrom }), 
                            t('bidReceivedDetails', { resourceTitle: rawNotification.node.data.resourceTitle }), 
                            `/webapp/${version}/bids`, rawNotification)
                        )
                    break
                case 'BID_REFUSED':
                    otherNotifs.push(
                        createOtherNotification(t('bidRefusedHeadline1'), t('bidRefusedHeadline2', { refuser: rawNotification.node.data.refusedBy }), 
                            t('bidRefusedDetails', { resourceTitle: rawNotification.node.data.resourceTitle }), 
                            `/webapp/${version}/bids`, rawNotification)
                        )
                    break
                case 'BID_ACCEPTED':
                    otherNotifs.push(
                        createOtherNotification(t('bidAcceptedHeadline1'), t('bidAcceptedHeadline2', { accepter: rawNotification.node.data.acceptedBy }), 
                            t('bidAcceptedDetails', { resourceTitle: rawNotification.node.data.resourceTitle }), 
                            `/webapp/${version}/bids`, rawNotification)
                        )
                    break
                case 'BID_EXPIRED':
                    otherNotifs.push(
                        createOtherNotification(t('bidExpiredHeadline1'), t('bidExpiredHeadline2', { resourceAuthor: rawNotification.node.data.resourceAuthor }), 
                            t('bidDExpiredDetails', { resourceTitle: rawNotification.node.data.resourceTitle }), 
                            `/webapp/${version}/bids`, rawNotification)
                        )
                    break
                case 'BID_CANCELLED':
                    otherNotifs.push(
                        createOtherNotification(t('bidDeletedHeadline1'), t('bidDeletedHeadline2', { cancelledBy: rawNotification.node.data.cancelledBy }), 
                            t('bidDeletedDetails', { resourceTitle: rawNotification.node.data.resourceTitle }), 
                            `/webapp/${version}/bids`, rawNotification)
                        )                    
                    break
                case 'BID_AUTO_DELETED_AFTER_RESOURCE_EXPIRED':
                    otherNotifs.push(
                        createOtherNotification(t('bidExpiredWithResourceHeadline1'), t('bidExpiredWithResourceHeadline2', { resourceAuthor: rawNotification.node.data.resourceAuthor }), 
                            t('bidDExpiredWithResourceDetails', { resourceTitle: rawNotification.node.data.resourceTitle }), 
                            `/webapp/${version}/bids`, rawNotification)
                        )
                    break
                case 'BID_AUTO_REFUSED_AFTER_RESOURCE_DELETED':
                    otherNotifs.push(
                        createOtherNotification(t('bidAutoRefusedHeadline1'), t('bidAutoRefusedHeadline2', { resourceAuthor: rawNotification.node.data.refusedBy }), 
                            t('bidAutoRefusedDetails', { resourceTitle: rawNotification.node.data.resourceTitle }), 
                            `/webapp/${version}/bids`, rawNotification)
                        )
                    break
                case 'TOKEN_GRANTED':
                    otherNotifs.push(
                        createOtherNotification(t('tokenGrantedHeadline1'), t('tokenGrantedHeadline2', { grantorName: rawNotification.node.data.grantorName }), 
                            t('tokenGrantedDetails', { amountOfTokens: rawNotification.node.data.amountOfTokens }), 
                            `/webapp/${version}/profile/tokens`, rawNotification)
                        )
                    break
                case 'AIRDROP_RECEIVED':
                    otherNotifs.push(
                        createOtherNotification(t('airdropHeadline1'), t('airdropHeadline2', { campaignName: rawNotification.node.data.campaignName }), 
                            t('airdropDetails', { amountOfTokens: rawNotification.node.data.amount }), 
                            `/webapp/${version}/profile/tokens`, rawNotification)
                        )
                    break
                case 'CAMPAIGN_BEGUN':
                    otherNotifs.push(
                        createOtherNotification(t('campaignBegunHeadline1'), t('campaignBegunHeadline2', { name: rawNotification.node.data.campaignName }), 
                            t('campaignBegunDetails', { airdropAmount: rawNotification.node.data.airdropAmount, multiplier: rawNotification.node.data.multiplier, airdrop: dayjs(rawNotification.node.data.airdrop).format(t('dateTimeFormat')) }), 
                            `/webapp/${version}/profile/tokens`, rawNotification)
                        )
                    break
                case 'AIRDROP_SOON':
                    otherNotifs.push(
                        createOtherNotification(t('airdropSoonHeadline1', { airdropAmount: rawNotification.node.data.airdropAmount }), t('airdropSoonHeadline2', { airdrop: dayjs(rawNotification.node.data.airdrop).format(t('dateTimeFormat')) }), 
                            t('airdropSoonDetails', { name: rawNotification.node.data.campaignName }), 
                            `/webapp/${version}/profile/tokens`, rawNotification)
                        )
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

const NOTIFICATION_IMAGE_BASE_SIZE = 120
const NotificationImage = ({ image } : { image: string | {
    resource: Resource;
    account: { id: number, name: string, avatarImagePublicId?: string };
} | undefined }) => {
    console.log('image', image)
    if(typeof image === 'string') {
        return <ResponsivePhotoBox baseSize={NOTIFICATION_IMAGE_BASE_SIZE}>
            <img style={{ borderRadius: 10 }} color="primary" src={image} />
        </ResponsivePhotoBox>
    } else if (!image) {
        return <NotificationsActive color="primary" sx={theme => ({ 
            fontSize: makePxSize(NOTIFICATION_IMAGE_BASE_SIZE),
            [theme.breakpoints.down('lg')]: {
                fontSize: makePxSize(NOTIFICATION_IMAGE_BASE_SIZE, screenSizesCoefficients[0]),
            },
            [theme.breakpoints.down('md')]: {
                fontSize: makePxSize(NOTIFICATION_IMAGE_BASE_SIZE, screenSizesCoefficients[1]),
            },
            [theme.breakpoints.down('sm')]: {
                fontSize: makePxSize(NOTIFICATION_IMAGE_BASE_SIZE, screenSizesCoefficients[2]),
            }
        })} />
    } else {
        return <ResourceImage accountName={image.account.name} 
            accountImagePublicId={image.account.avatarImagePublicId} baseWidth={NOTIFICATION_IMAGE_BASE_SIZE}
            resourceImagePublicId={image.resource.images.length > 0 ? image.resource.images[0].publicId : undefined} />
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
        renderNoData={() => <Typography color="primary.contrastText" variant="body1">{uiContext.i18n.translator('noNotification')}</Typography>}
        containerStyle={{
            alignItems: 'center',
            overflow: 'auto',
            width: '100%',
        }} onBottom={() => {
            loadEarlier()
        }}
        renderItem={(notif: NotificationData) => {
            const fontWeight = notif.read ? 'initial': 'bolder'
            return <Stack data-testid={`Notification:${notif.id}`} key={notif.id} direction="row" gap="1rem" sx={theme => ({ 
                    cursor: 'pointer' ,
                    width: makePxSize(900),
                    [theme.breakpoints.down('lg')]: {
                        width: makePxSize(900, 0.8),
                    },
                    [theme.breakpoints.down('md')]: {
                        width: makePxSize(900, 0.5),
                    },
                    [theme.breakpoints.down('sm')]: {
                        width: '100%',
                    }
                })}>
                <NotificationImage image={notif.image} />
                <Link flex="1" onClick={notif.onClick} sx={{ textDecorationLine: 'none' }}>
                    <Typography variant="body1" fontWeight={fontWeight}>{notif.headline1}</Typography>
                    <Typography variant="body1" fontWeight={fontWeight}>{notif.headline2}</Typography>
                    <Typography variant="body1" fontWeight={fontWeight}>{notif.text}</Typography>
                </Link>
                <Stack alignItems="flex-end">
                    <Typography variant="body1" flex="0 0 20%" color="primary" fontWeight={fontWeight}>{userFriendlyTime(notif.created, uiContext.i18n.translator('shortDateFormat'))}</Typography>
                    { !notif.read && <FiberManualRecord color="primary" /> }
                </Stack>
            </Stack>
    }} />
}

export default Notifications