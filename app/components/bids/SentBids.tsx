import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { Bid, bidFromServerGraph } from "@/lib/schema"
import { gql, useLazyQuery, useMutation } from "@apollo/client"
import { useContext, useEffect, useState } from "react"
import { AppContext } from "../AppContextProvider"
import LoadedList from "../LoadedList"
import React from "react"
import { t } from "@/i18n"
import { View } from "react-native"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import { IMAGE_BORDER_RADIUS } from "@/lib/images"
import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { IconButton, Text } from "react-native-paper"
import ResourceAuthorHeader from "../resources/ResourceAuthorHeader"
import Images from "@/Images"
import dayjs from "dayjs"
import { OptionSelect } from "../layout/lib"
import OperationFeedback from "../OperationFeedback"
import ConfirmDialog from "../ConfirmDialog"
import PriceTag, { PriceTagSizeEnum } from "../tokens/PriceTag"

const PAGE_SIZE = 10

export const GET_MY_BIDS = gql`query bids($first: Int, $after: Cursor, $includeInactive: Boolean) {
  myBids(first: $first, after: $after, includeInactive: $includeInactive) {
    edges {
      node {
        id
        accepted
        amountOfTokens
        created
        deleted
        refused
        validUntil
        resourceByResourceId {
          accountByAccountId {
            id
            imageByAvatarImageId {
              publicId
            }
            name
          }
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
        }
        accountByAccountId {
          id
          imageByAvatarImageId {
            publicId
          }
          name
        }
      }
      cursor
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
  }
}`

export const DELETE_BID = gql`mutation DeleteBid($bidId: Int) {
  deleteBid(input: {bidId: $bidId}) {
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

interface SentBidCardProps {
  bid: Bid
  navigation: NavigationHelpers<ParamListBase>
  onBidHandled: () => void
}

const SentBidCard = ({ bid, navigation, onBidHandled }: SentBidCardProps) => {
    const [deleteBid, { loading: deleting, error: deleteError, reset: deleteReset }] = useMutation(DELETE_BID)
    const inactiveDescription = getInactiveBidDescription(bid)
    const [confirmDelete, setConfirmDelete] = useState(false)
    return <View 
        style={{ backgroundColor: lightPrimaryColor, borderRadius: IMAGE_BORDER_RADIUS, padding: 6, gap: 6 }}>
        <View style={{ flexDirection: 'row' }}>
            <ResourceAuthorHeader avatarAccountInfo={bid.resource.account!} resource={bid.resource} onPress={() => {
                navigation.navigate('viewResource', { resourceId: bid.resource.id })
            }} />
        </View>
        <View style={{ alignItems: 'center' }}>
          <PriceTag size={PriceTagSizeEnum.normal} value={bid.amountOfTokens} label={t('sentBidLabel')}/>
          { bid.resource.price && <PriceTag value={bid.resource.price} label={t('resourcePriceLabel')}/> }
        </View>
        { inactiveDescription ?
            <Text variant="labelSmall">{inactiveDescription}</Text>
        :
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <IconButton icon={p => <Images.View fill={p.color} />} onPress={() => {
                    navigation.navigate('viewResource', { resourceId: bid.resource.id })
                }} />
                <IconButton loading={deleting} size={20} icon={p => <Images.Cross fill={p.color} />} iconColor={primaryColor} onPress={() => {
                    setConfirmDelete(true)
                }}/>
                <OperationFeedback error={deleteError} onDismissError={deleteReset}/>
            </View>
        }
        <ConfirmDialog visible={confirmDelete}
          title={t('confirmBidDeleteDialogTitle')} onResponse={async confirmed => {
            if(confirmed) {
              await deleteBid({ variables: { bidId: bid.id } })
              onBidHandled()
            }
            setConfirmDelete(false)
          }} />
    </View>
}

const SentBids = ({navigation, initialIncludeInactive} : {navigation: NavigationHelpers<ParamListBase>, initialIncludeInactive: boolean}) => {
    const appContext = useContext(AppContext)
    const [getBids, { data }] = useLazyQuery(GET_MY_BIDS)
    const [bids, setBids] = useState<DataLoadState<Bid[]>>(initial(true, []))
    const [includeInactive, setIncludeInactive] = useState(initialIncludeInactive)

    const loadFromScratch = async () => {
        try {
            setBids(initial(true, []))
            const res = await getBids({ variables: { first: PAGE_SIZE, includeInactive }})
            setBids(fromData(res.data.myBids.edges.map((d: any) => bidFromServerGraph(d.node, appContext.categories.data!))))
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
            data={bids?.data} displayItem={bid => <SentBidCard key={bid.id} bid={bid} navigation={navigation}
              onBidHandled={() => setBids(prev => fromData(prev.data!.filter(b => b.id != bid.id)))} />} 
            loadEarlier={async () => { getBids({ variables: { first: PAGE_SIZE, after: data.myBids.pageInfo.endCursor } })}} />
    </View>
}

export default SentBids
