import { gql, useLazyQuery } from "@apollo/client"
import { useContext, useEffect, useState } from "react"
import { UiContext } from "../scaffold/UiContextProvider"
import { IconButton, Stack, Tooltip, Typography } from "@mui/material"
import Refresh from '@mui/icons-material/Refresh'
import LoadedList from "../scaffold/LoadedList"
import Clock from '@mui/icons-material/AccessTime'
import { LoadingButton } from "@mui/lab"
import dayjs, { Dayjs } from "dayjs"

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

const TransactionsHistory = () => {
    const uiContext = useContext(UiContext)
    const [getTokensHistory, { data, error, refetch }] = useLazyQuery(GET_TOKENS_HISTORY, { variables: { first: PAGESIZE } })
    const [ historyItems, setHistoryItems ] = useState<any[]>([])
    const [loadingMore, setLoadingMore] = useState(false)
    const [loadingFromScratch, setLoadingFromScratch] = useState(false)

    const getTokenMovementTitle = (tokenHistory: any) => {
        const t = uiContext.i18n.translator
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
            default:
                throw new Error(`Unexpected token transaction type ${tokenHistory.node.tokenTransactionTypeByTokenTransactionTypeId.id}`)
        }
    }
    
    const loadFromScratch = async () => {
        setLoadingFromScratch(true)
        try {
            const res = await getTokensHistory()
            setHistoryItems(res.data.getTokensHistory.edges)
        } finally {
            setLoadingFromScratch(false)
        }
    }
    useEffect(() => {
        if(historyItems.length === 0) {
            loadFromScratch()
        }
    }, [])

    return <Stack>
        <IconButton sx={{ alignSelf: 'center' }} onClick={() => {
            setHistoryItems([])
            loadFromScratch()
        }}>
            <Refresh />
        </IconButton> 
        <LoadedList loading={loadingFromScratch} error={error} items={historyItems}
            containerStyle={{ gap: '0.5rem', padding: 0, margin: 0 }}
            renderItem={(item: any) => <Stack key={item.node.id} direction="row" 
                sx={theme => ({ gap: '1rem', backgroundColor: theme.palette.primary.light, borderRadius: '1rem', 
                padding: '0.5rem', alignItems: 'center' })}>
                <Stack alignItems="center" flex="0 0 30%">
                    <Typography variant="body1">{`${item.node.movement < 0 ? item.node.movement : '+' + item.node.movement}`}</Typography>
                    <Tooltip title={dayjs(item.node.created).format('D/M H:mm')}>
                        <Typography  textAlign="center" variant="body1">{dayjs(item.node.created).fromNow()}</Typography>
                    </Tooltip>
                </Stack>
                <Typography variant="body1" flexWrap="wrap" flex="0 0 70%">{getTokenMovementTitle(item)}</Typography>
            </Stack>}/>
        { data?.getTokensHistory?.pageInfo?.hasNextPage && <LoadingButton startIcon={<Clock/>} loading={loadingMore} onClick={async () => {
            setLoadingMore(true)
            try{
                const res = await refetch({ first: PAGESIZE, after: data.getTokensHistory.pageInfo.endCursor })
                setHistoryItems(prev => [...prev, ...res.data.getTokensHistory.edges])
            } finally {
                setLoadingMore(false)
            }
        }}>{uiContext.i18n.translator('loadMore')}</LoadingButton>}
    </Stack>
}

export default TransactionsHistory