import { InputAdornment, Stack, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import SearchIcon from '@mui/icons-material/Search'
import { useDebounce } from "use-debounce"
import { gql, useLazyQuery } from "@apollo/client"
import { DataGrid } from '@mui/x-data-grid'
import LoadedZone from "../scaffold/LoadedZone"

const PAGE_SIZE = 50

const SEARCH_SERVER_LOGS = gql`query SearchServerLogs($searchTerm: String, $last: Int, $first: Int, $before: Cursor, $after: Cursor) {
  searchServerLogs(
    after: $after
    before: $before
    first: $first
    last: $last
    searchTerm: $searchTerm
) {
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
    totalCount
    edges {
      node {
        context
        id
        level
        message
        stack
        timestamp
      }
    }
  }
}`

const ServerLogs = () => {
    const [term, setTerm] = useState('')
    const [debouncedTerm] = useDebounce(term, 700)
    const [search, { data, loading, error }] = useLazyQuery(SEARCH_SERVER_LOGS)
    const [paginationModel, setPaginationModel] = useState({ pageSize: PAGE_SIZE, page: 0 })

    useEffect(() => {
        search({ variables: { searchTerm: term, first: PAGE_SIZE } })
    }, [debouncedTerm])

    return <Stack>
        <TextField label="Search" id="term" onChange={e => setTerm(e.currentTarget.value)} name="term" 
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}/>
        <LoadedZone loading={loading} error={error}>
            { data && <DataGrid paginationMode="server" rowHeight={100} paginationModel={paginationModel} rowCount={data.searchServerLogs.totalCount} columns={[
                { field: 'id', headerName: 'Id'},
                { field: 'level', headerName: 'Level'},
                { field: 'timestamp', headerName: 'Timestamp', width: 200},
                { field: 'context', headerName: 'Context'},
                { field: 'message', headerName: 'Message', width: 500, renderCell: p => (<Typography sx={{ whiteSpace: 'break-spaces' }}>{p.value}</Typography>)},
                { field: 'stack', headerName: 'Stack'}
            ]}
            rows={data.searchServerLogs.edges.map((sa: any) => sa.node)}
            onPaginationModelChange={(model, details) => {
                if(model.page > paginationModel.page) {
                    if(!data.searchServerLogs.pageInfo.hasNextPage) return
                    search({ variables: { searchTerm: term, after: data.searchServerLogs.pageInfo.endCursor, first: PAGE_SIZE } })
                } else {
                    if(!data.searchServerLogs.pageInfo.hasPreviousPage) return
                    search({ variables: { searchTerm: term, before: data.searchServerLogs.pageInfo.startCursor, last: PAGE_SIZE } })
                }
                setPaginationModel({ pageSize: PAGE_SIZE, page: model.page })
            }} /> } 
        </LoadedZone>
    </Stack>
}

export default ServerLogs