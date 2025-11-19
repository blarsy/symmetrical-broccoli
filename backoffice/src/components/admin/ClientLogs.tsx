import { InputAdornment, Stack, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import SearchIcon from '@mui/icons-material/Search'
import { useDebounce } from "use-debounce"
import { gql, useLazyQuery } from "@apollo/client"
import { DataGrid } from '@mui/x-data-grid'
import LoadedZone from "../scaffold/LoadedZone"

const PAGE_SIZE = 50

const SEARCH_CLIENT_LOGS = gql`query SearchServerLogs($searchTerm: String, $after: Cursor, $first: Int, $last: Int, $before: Cursor) {
  searchClientLogs(
    after: $after
    before: $before
    first: $first
    last: $last
    searchTerm: $searchTerm
  ) {
    totalCount
    edges {
      node {
        accountId
        activityId
        created
        data
        level
      }
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
  }
}`

const ClientLogs = () => {
    const [term, setTerm] = useState('')
    const [debouncedTerm] = useDebounce(term, 700)
    const [search, { data, loading, error }] = useLazyQuery(SEARCH_CLIENT_LOGS)
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
            { data && <DataGrid paginationMode="server" rowHeight={100} paginationModel={paginationModel} rowCount={data.searchClientLogs.totalCount} columns={[
                { field: 'id', headerName: 'Id'},
                { field: 'accountId', headerName: 'Account Id'},
                { field: 'level', headerName: 'Level'},
                { field: 'created', headerName: 'Timestamp', width: 200},
                { field: 'activityId', headerName: 'Activity Id'},
                { field: 'data', headerName: 'Data', width: 500, renderCell: p => (<Typography sx={{ whiteSpace: 'break-spaces' }}>{p.value}</Typography>)}
            ]}
            rows={data.searchClientLogs.edges.map((sa: any, idx: number) => ({ ...sa.node, ...{ id: idx }}))}
            onPaginationModelChange={(model, details) => {
                if(model.page > paginationModel.page) {
                    if(!data.searchClientLogs.pageInfo.hasNextPage) return
                    search({ variables: { searchTerm: term, after: data.searchClientLogs.pageInfo.endCursor, first: PAGE_SIZE } })
                } else {
                    if(!data.searchClientLogs.pageInfo.hasPreviousPage) return
                    search({ variables: { searchTerm: term, before: data.searchClientLogs.pageInfo.startCursor, last: PAGE_SIZE } })
                }
                setPaginationModel({ pageSize: PAGE_SIZE, page: model.page })
            }} /> } 
        </LoadedZone>
    </Stack>
}

export default ClientLogs