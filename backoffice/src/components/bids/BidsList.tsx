import { gql, useLazyQuery } from "@apollo/client"
import LoadedList from "../scaffold/LoadedList"
import { useContext, useEffect, useState } from "react"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { UiContext } from "../scaffold/UiContextProvider"
import { Checkbox, FormControlLabel, FormGroup, Stack, Typography } from "@mui/material"
import { makePxSize } from "../misc"
import { Bid, Category, fromServerGraphAccount, fromServerGraphResource } from "@/lib/schema"
import useCategories from "@/lib/useCategories"
import { LoadingButton } from "@mui/lab"
import BidSent from "./BidSent"
import BidReceived from "./BidReceived"

const PAGESIZE = 5
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
        }
        accountByAccountId {
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

const bidFromServerGraph = (bid: any, categories: Category[]): Bid => {
    return {
        id: bid.id, amountOfTokens: bid.amountOfTokens, created: bid.created, accepted: bid.accepted,
        refused: bid.refused, deleted: bid.deleted, resource: fromServerGraphResource(bid.resourceByResourceId, categories),
        account: fromServerGraphAccount(bid.accountByAccountId), validUntil: bid.validUntil
    }
}

const BidsList = () => {
    const uiContext = useContext(UiContext)
    const categories = useCategories()
    const [myBids, setMyBids] = useState<DataLoadState<Bid[]>>()
    const [myReceivedBids, setMyReceivedBids] = useState<DataLoadState<Bid[]>>()
    const [loadingMoreBids, setLoadingMoreBids] = useState(false)
    const [loadingMoreReceivedBids, setLoadingMoreReceivedBids] = useState(false)
    const [getMyBids, { data: getMyBidsData, refetch: refetchMyBids }] = useLazyQuery(GET_MY_BIDS, { fetchPolicy: "network-only" })
    const [getMyReceivedBids, { data: getMyReceivedBidsData, refetch: refetchMyReceivedBids }] = useLazyQuery(GET_MY_RECEIVED_BIDS, { variables: { first: PAGESIZE }, fetchPolicy: "network-only"})
    const [onlyActiveSentOption, setOnlyActiveSentOption] = useState<boolean>(true)
    const [onlyActiveReceivedOption, setOnlyActiveReceivedOption] = useState<boolean>(true)

    const loadSentBids = async(includeInactive?: boolean) => {
      setMyBids(initial(true))
      try {
          const res = await getMyBids({ variables: { first: PAGESIZE, includeInactive }})
          setMyBids(fromData(res.data.myBids.edges.map((d: any) => bidFromServerGraph(d.node, categories.data!))))
      } catch(e) {
          setMyBids(fromError(e, uiContext.i18n.translator('requestError')))
      }
    }

    const loadReceivedBids = async(includeInactive?: boolean) => {
      setMyReceivedBids(initial(true))
      try {
          const res = await getMyReceivedBids({ variables: { first: PAGESIZE, includeInactive }})
          setMyReceivedBids(fromData(res.data.myReceivedBids.edges.map((d: any) => bidFromServerGraph(d.node, categories.data!))))
      } catch(e) {
          setMyReceivedBids(fromError(e, uiContext.i18n.translator('requestError')))
      }
    }

    const loadFromScratch = async() => {
        return Promise.all([
          loadSentBids(!onlyActiveSentOption),
          loadReceivedBids(!onlyActiveReceivedOption)
        ])
    }

    useEffect(() => {
      if(categories.data) {
        loadFromScratch()
      }
    }, [categories])

    useEffect(() => {
      loadSentBids(!onlyActiveSentOption)
    }, [onlyActiveSentOption])

    useEffect(() => {
      loadReceivedBids(!onlyActiveReceivedOption)
    }, [onlyActiveReceivedOption])

    return <Stack overflow="auto">
      <Stack sx={theme => ({
          alignItems: 'stretch',
          margin: '0 auto',
          gap: '2rem',
          width: makePxSize(900),
          flexDirection: 'row',
          [theme.breakpoints.down('lg')]: {
              width: makePxSize(900, 0.8),
          },
          [theme.breakpoints.down('md')]: {
              width: makePxSize(900, 0.5),
              flexDirection: 'column'
          },
          [theme.breakpoints.down('sm')]: {
              width: '100%',
              padding: '1rem'
          }
      })}>
          <Stack sx={theme => ({
            [theme.breakpoints.up('md')]: {
              flex: '0 0 50%'
            }
          })}>
            <Typography color="primary" variant="h4">{uiContext.i18n.translator('myReceivedBidsTitle')}</Typography>
            <FormGroup>
              <FormControlLabel control={<Checkbox 
                  onChange={e => setOnlyActiveReceivedOption(prev => !prev)} 
                  checked={onlyActiveReceivedOption} />} 
                label={uiContext.i18n.translator('onlyShowActiveBids')}/>
            </FormGroup>
            <LoadedList testID="BidsReceivedList" error={myReceivedBids?.error} loading={!!myReceivedBids?.loading} items={myReceivedBids?.data!} 
                renderItem={(bid: Bid) => <BidReceived data-testid={`BidReceived:${bid.id}`} key={bid.id} bid={bid} onAction={accepted => {
                  setMyReceivedBids(prev => fromData(prev!.data!.filter(pbid => pbid.id !== bid.id)))
                }} />} containerStyle={{ gap: '1rem' }}
                renderNoData={() => <Typography color="primary.contrastText" variant="body1">{uiContext.i18n.translator('noReceivedBids')}</Typography>}/>
            { getMyReceivedBidsData && getMyReceivedBidsData.myReceivedBids.pageInfo.hasNextPage && <LoadingButton loading={loadingMoreReceivedBids} onClick={async () => {
              setLoadingMoreReceivedBids(true)
              try {
                const res = await refetchMyReceivedBids({ first: PAGESIZE, after: getMyReceivedBidsData.myReceivedBids.pageInfo.endCursor })
                setMyReceivedBids(prev => fromData([...prev?.data!, ...res.data.myReceivedBids.edges.map((rawBid: any) => bidFromServerGraph(rawBid.node, categories.data!))]))
              } finally {
                setLoadingMoreReceivedBids(false)
              }
            }}>{uiContext.i18n.translator('loadMore')}</LoadingButton> }
          </Stack>
          <Stack sx={theme => ({
            [theme.breakpoints.up('md')]: {
              flex: '0 0 50%'
            }
          })}>
            <Typography color="primary" variant="h4">{uiContext.i18n.translator('myBidsTitle')}</Typography>
            <FormGroup>
              <FormControlLabel control={<Checkbox 
                  onChange={e => setOnlyActiveSentOption(prev => !prev)} 
                  checked={onlyActiveSentOption} />} 
                label={uiContext.i18n.translator('onlyShowActiveBids')}/>
            </FormGroup>
            <LoadedList testID="BidsSentList" error={myBids?.error} loading={!!myBids?.loading} items={myBids?.data!} containerStyle={{
              gap: '1rem'
            }}
                renderItem={(bid: Bid) => <BidSent data-testid={`BidSent:${bid.id}`} key={bid.id} bid={bid} onCancel={() => {
                  setMyBids(prev => fromData(prev!.data!.filter(pbid => pbid.id !== bid.id)))
                }}/>} 
                renderNoData={() => <Typography color="primary.contrastText" variant="body1">{uiContext.i18n.translator('noBids')}</Typography>}/>
            { getMyBidsData && getMyBidsData.myBids.pageInfo.hasNextPage && <LoadingButton loading={loadingMoreBids} onClick={async () => {
              setLoadingMoreBids(true)
              try {
                const res = await refetchMyBids({ first: PAGESIZE, after: getMyBidsData.myBids.pageInfo.endCursor })
                setMyBids(prev => fromData([...prev?.data!, ...res.data.myBids.edges.map((rawBid: any) => bidFromServerGraph(rawBid.node, categories.data!))]))
              } finally {
                setLoadingMoreBids(false)
              }
            }}>{uiContext.i18n.translator('loadMore')}</LoadingButton> }
          </Stack>
      </Stack>
    </Stack>
}

export default BidsList