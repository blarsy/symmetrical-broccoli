import { InputAdornment, Stack, TextField } from "@mui/material"
import { useEffect, useState } from "react"
import SearchIcon from '@mui/icons-material/Search'
import { useDebounce } from "use-debounce"
import { gql, useLazyQuery } from "@apollo/client"
import { DataGrid } from '@mui/x-data-grid'
import LoadedZone from "../scaffold/LoadedZone"

const PAGE_SIZE = 10
const SEARCH_ACCOUNTS = gql`query SearchAccounts($searchTerm: String, $after: Cursor, $before: Cursor, $first: Int, $last: Int) {
  searchAccounts(searchTerm: $searchTerm, first: $first, last: $last, after: $after, before: $before) {
    edges {
      node {
        amountOfTokens
        email
        id
        created
        language
        lastSuspensionWarning
        name
        recoveryCode
        recoveryCodeExpiration
        unlimitedUntil
        willingToContribute
        logLevel
        locationByLocationId {
          address
          latitude
          longitude
        }
        activated
        imageByAvatarImageId {
          publicId
        }
      }
    }
    pageInfo {
      startCursor
      endCursor
      hasNextPage
      hasPreviousPage
    }
    totalCount
  }
}`

const Accounts = () => {
    const [term, setTerm] = useState('')
    const [debouncedTerm] = useDebounce(term, 700)
    const [search, { data, loading, error }] = useLazyQuery(SEARCH_ACCOUNTS)
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
            { data && <DataGrid paginationMode="server" paginationModel={paginationModel} rowCount={data.searchAccounts.totalCount} columns={[
                { field: 'id', headerName: 'Id'},
                { field: 'name', headerName: 'Name'},
                { field: 'email', headerName: 'Email'},
                { field: 'language', headerName: 'Lang'},
                { field: 'amountOfTokens', headerName: '#Topes'},
                { field: 'created', headerName: 'Date Création'},
                { field: 'recoveryCode', headerName: 'Code récup'},
                { field: 'recoveryCodeExpiration', headerName: 'Exp. code'},
                { field: 'address', headerName: 'Address', valueGetter: (value, row) => row.locationByLocationId && row.locationByLocationId.address }
            ]}
            rows={data.searchAccounts.edges.map((sa: any) => sa.node)}
            onPaginationModelChange={(model, details) => {
                if(model.page > paginationModel.page) {
                    if(!data.searchAccounts.pageInfo.hasNextPage) return
                    search({ variables: { searchTerm: term, after: data.searchAccounts.pageInfo.endCursor, first: PAGE_SIZE } })
                } else {
                    if(!data.searchAccounts.pageInfo.hasPreviousPage) return
                    search({ variables: { searchTerm: term, before: data.searchAccounts.pageInfo.startCursor, last: PAGE_SIZE } })
                }
                setPaginationModel({ pageSize: PAGE_SIZE, page: model.page })
            }} /> } 
        </LoadedZone>
    </Stack>
}

export default Accounts