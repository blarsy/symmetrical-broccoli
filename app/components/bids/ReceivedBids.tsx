import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import React, { useContext, useState } from "react"
import { useEffect } from "react"
import { View } from "react-native"
import { OptionSelect } from "../layout/lib"
import LoadedList from "../LoadedList"
import { gql, useLazyQuery, useMutation } from "@apollo/client"
import { Bid, bidFromServerGraph } from "@/lib/schema"
import { AppContext } from "../AppContextProvider"
import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { t } from "@/i18n"
import dayjs from "dayjs"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { IMAGE_BORDER_RADIUS } from "@/lib/images"
import ResourceAuthorHeader from "../resources/ResourceAuthorHeader"
import { IconButton, Text } from "react-native-paper"
import OperationFeedback from "../OperationFeedback"
import ConfirmDialog from "../ConfirmDialog"
import PriceTag, { PriceTagSizeEnum } from "../tokens/PriceTag"
import Images from "@/Images"
import BareIconButton from "../layout/BareIconButton"

const PAGE_SIZE = 10

export const GET_MY_RECEIVED_BIDS = gql`query bids($first: Int, $after: Cursor, $includeInactive: Boolean) {
  myReceivedBids(first: $first, after: $after, includeInactive: $includeInactive) {
    edges {
      cursor
      node {
        id
        accepted
        amountOfTokens
        created
        deleted
        refused
        validUntil
        resourceByResourceId {
          title
          price
          expiration
          resourcesImagesByResourceId {
            nodes {
              imageByImageId {
                publicId
              }
            }
          }
          id
          campaignsResourcesByResourceId {
            nodes {
              campaignId
            }
          }
          accountsPublicDatumByAccountId {
            id
            name
            imageByAvatarImageId {
              publicId
            }
          }
        }
        accountsPublicDatumByAccountId {
          id
          imageByAvatarImageId {
            publicId
          }
          name
        }
      }
    }
    pageInfo {
      endCursor
      hasNextPage
    }
  }
}`

export const ACCEPT_BID = gql`mutation AcceptBid($bidId: UUID) {
  acceptBid(input: {bidId: $bidId}) {
    integer
  }
}`

export const REFUSE_BID = gql`mutation RefuseBid($bidId: UUID) {
  refuseBid(input: {bidId: $bidId}) {
    integer
  }
}`

const getInactiveBidDescription = (bid: Bid) => {
    const dateFormat = t('dateTimeFormat')

    if(bid.accepted || bid.deleted || bid.refused || bid.validUntil < new Date() ) {
        if(bid.accepted) {
            return t('inactiveBecauseAccepted', { date: dayjs(bid.accepted).format(dateFormat)})
        } else if(bid.refused) {
            return t('inactiveBecauseRefused', { date: dayjs(bid.refused).format(dateFormat)})
        } else if(bid.validUntil < new Date()) {
            return t('inactiveBecauseExpired', { date: dayjs(bid.validUntil).format(dateFormat) })
        } else if(bid.deleted) {
            return t('inactiveBecauseDeleted', { date: dayjs(bid.deleted).format(dateFormat) })
        }
    } else {
        return null
    }
}

interface ReceivedBidCardProps {
  bid: Bid
  navigation: NavigationHelpers<ParamListBase>
  onBidHandled: () => void
}

const ReceivedBidCard = ({ bid, navigation, onBidHandled }: ReceivedBidCardProps) => {
    const [acceptBid, { loading: accepting, error: acceptError, reset: acceptReset }] = useMutation(ACCEPT_BID)
    const [refuseBid, { loading: refusing, error: refuseError, reset: refuseReset }] = useMutation(REFUSE_BID)
    const inactiveDescription = getInactiveBidDescription(bid)
    const [confirmingAccept, setConfirmingAccept] = useState(false)
    const [confirmingRefusal, setConfirmingRefusal] = useState(false)
    return <View 
        style={{ backgroundColor: lightPrimaryColor, borderRadius: IMAGE_BORDER_RADIUS, padding: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <ResourceAuthorHeader avatarAccountInfo={bid.account!} resource={bid.resource} onPress={() => {
                navigation.navigate('viewResource', { resourceId: bid.resource.id })
            }} />
            <BareIconButton size={35} onPress={() => {
              setTimeout(() => navigation.navigate('chat', {
                  screen: 'conversation',
                  params: {
                      resourceId: bid.resource.id,
                      otherAccountId: bid.account.id
                  }
              }))
            } } Image={Images.Chat} />
        </View>
        <View style={{ alignItems: 'center' }}>
          <PriceTag value={bid.amountOfTokens} label={t('receivedBidLabel')} size={PriceTagSizeEnum.normal}/>
          { bid.resource.price && <PriceTag value={bid.resource.price} label={t('resourcePriceLabel')} /> }
        </View>
        { inactiveDescription ?
            <Text variant="labelSmall">{inactiveDescription}</Text>
        :
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <IconButton loading={refusing} icon="thumb-down" size={35} iconColor={primaryColor} onPress={() => {
                    setConfirmingRefusal(true)
                }} />
                <OperationFeedback error={refuseError} onDismissError={refuseReset} />
                <IconButton loading={accepting} icon="thumb-up" size={35} onPress={async () => {
                    setConfirmingAccept(true)
                }}/>
                <OperationFeedback error={acceptError} onDismissError={acceptReset}/>
            </View>
        }
        <ConfirmDialog question={t('meaningOfAcceptingOffer')} title={t('confirmingAcceptDialogTitle')} visible={!!confirmingAccept}
          onResponse={async confirmed => {
            if(confirmed) {
              await acceptBid({ variables: { bidId: bid.id } })
              onBidHandled()
            }
            setConfirmingAccept(false)
          }} />
        <ConfirmDialog title={t('confirmingRefusalDialogTitle')} visible={!!confirmingRefusal}
          onResponse={async confirmed => {
            if(confirmed) {
              await refuseBid({ variables: { bidId: bid.id, notificationType: null } })
              onBidHandled()
            }
            setConfirmingRefusal(false)
          }} />
    </View>
}

const ReceivedBids = ({navigation, initialIncludeInactive} : {navigation: NavigationHelpers<ParamListBase>, initialIncludeInactive: boolean}) => {
        const appContext = useContext(AppContext)
    const [getBids, { data }] = useLazyQuery(GET_MY_RECEIVED_BIDS)
    const [bids, setBids] = useState<DataLoadState<Bid[]>>(initial(true, []))
    const [includeInactive, setIncludeInactive] = useState(initialIncludeInactive)

    const loadFromScratch = async () => {
        try {
            setBids(initial(true, []))
            const res = await getBids({ variables: { first: PAGE_SIZE, includeInactive }})
            setBids(fromData(res.data.myReceivedBids.edges.map((d: any) => bidFromServerGraph(d.node, appContext.categories.data!))))
        } catch (e) {
            setBids(fromError(e as Error))
        }
    }

    useEffect(() => {
        if(appContext.categories.data) {
            loadFromScratch()
        }
    }, [includeInactive, appContext.categories])

    useEffect(() => {
        setIncludeInactive(initialIncludeInactive)
        if(appContext.categories.data) {
            loadFromScratch()
        }
    }, [initialIncludeInactive, appContext.categories])

    return <View style={{ gap: 6 }}>
        <OptionSelect title={t('includeInactiveLabel')} value={includeInactive}
            onChange={() => setIncludeInactive(prev => !prev)} />
        <LoadedList loading={!!bids?.loading} error={bids?.error} noDataLabel={t('noBids')}
            contentContainerStyle={{ gap: 6 }}
            data={bids?.data} displayItem={bid => <ReceivedBidCard key={bid.id} bid={bid} navigation={navigation} onBidHandled={() => setBids(prev => fromData(prev.data!.filter(b => b.id != bid.id)))} />} 
            loadEarlier={async () => { getBids({ variables: { first: PAGE_SIZE, after: data.myReceivedBids.pageInfo.endCursor } })}} />
    </View>
}

export default ReceivedBids