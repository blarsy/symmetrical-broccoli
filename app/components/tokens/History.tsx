import React, { useEffect, useState } from "react"
import { Card, IconButton, Text } from "react-native-paper"
import { lightPrimaryColor } from "../layout/constants"
import { gql, useLazyQuery } from "@apollo/client"
import LoadedList from "../LoadedList"
import { t } from "@/i18n"
import dayjs from "dayjs"
import Images from "@/Images"
import { View } from "react-native"
import { WhiteButton } from "../layout/lib"

const PAGESIZE = 5
export const GET_TOKENS_HISTORY = gql`query GetTokensHistory($after: Cursor, $first: Int) {
    getTokensHistory(first: $first, after: $after) {
      edges {
        cursor
        node {
          created
          id
          movement
          tokenTransactionTypeByTokenTransactionTypeId {
            code
            id
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }`

const getTokenMovementTitle = (tokenHistory: any) => {
    switch(tokenHistory.node.tokenTransactionTypeByTokenTransactionTypeId.id){
        case 1:
            return t('addedLogo')
        case 2:
            return t('addedLocation')
        case 3:
            return t('addedLink')
        case 4:
            return t('addedSomeResourcePicture')
        case 5:
            return t('createdNewResource')
        case 6:
            return t('tokenConsumed')
        case 7:
            return t('becameContributor')
        case 8:
            return t('sentTokens')
        case 9:
            return t('receivedTokens')
        case 10:
            return t('bidCreated')
        case 11:
            return t('bidCancelled')
        case 12:
            return t('bidAccepted')
        case 13:
            return t('tokensGranted')
        case 14:
            return t('priceSetOnResource')
        case 16:
            return t('airdropReceived')
        default:
            throw new Error(`Unexpected token transaction type ${tokenHistory.node.tokenTransactionTypeByTokenTransactionTypeId.id}`)
    }
}

const History = () => {
    const [getTokensHistory, { data, error, refetch }] = useLazyQuery(GET_TOKENS_HISTORY, { variables: { first: PAGESIZE } })
    const [ historyItems, setHistoryItems ] = useState<any[]>([])
    const [loadingMore, setLoadingMore] = useState(false)
    const [loadingFromScratch, setLoadingFromScratch] = useState(false)
    
    const loadFromScratch = async () => {
        setLoadingFromScratch(true)
        try {
            const res = await getTokensHistory()
            setHistoryItems(prev => [...prev, ...res.data.getTokensHistory.edges])
        } finally {
            setLoadingFromScratch(false)
        }
    }
    useEffect(() => {
        loadFromScratch()
    }, [])

    return <Card testID="tokenHistory" style={{ backgroundColor: lightPrimaryColor, margin: 10, padding: 10 }} contentStyle={{ alignItems: 'center' }}>
        <IconButton style={{ margin: 7, borderRadius: 0}} size={15} icon={Images.Refresh} onPress={() => {
            setHistoryItems([])
            loadFromScratch()
        }} /> 
        <LoadedList loading={loadingFromScratch} error={error} data={historyItems}
            contentContainerStyle={{ gap: 10, padding: 0, margin: 0 }}
            displayItem={(item: any, idx) => <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text testID={`tokenHistory:${idx}:date`}>{dayjs(item.node.created).format('D/M H:mm')}</Text>
                <View>
                    <Text testID={`tokenHistory:${idx}:movement`} variant="headlineMedium" style={{ textAlign: 'right' }}>{`${item.node.movement < 0 ? item.node.movement : '+' + item.node.movement}`}</Text>
                    <Text testID={`tokenHistory:${idx}:title`}>{getTokenMovementTitle(item)}</Text>
                </View>
            </View>}/>
        { data?.getTokensHistory?.pageInfo?.hasNextPage && <WhiteButton icon="clock" loading={loadingMore} onPress={async () => {
            setLoadingMore(true)
            try{
                const res = await refetch({ first: PAGESIZE, after: data.getTokensHistory.pageInfo.endCursor })
                setHistoryItems(prev => [...prev, ...res.data.getTokensHistory.edges])
            } finally {
                setLoadingMore(false)
            }
        }}>{t('loadMore')}</WhiteButton>}
    </Card>
}

export default History