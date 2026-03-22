'use client'

import { InputAdornment, Stack, TextField } from "@mui/material"
import { useEffect, useState } from "react"
import SearchIcon from '@mui/icons-material/Search'
import { useDebounce } from "use-debounce"
import { gql, useLazyQuery } from "@apollo/client"
import { DataGrid } from '@mui/x-data-grid'
import LoadedZone from "../scaffold/LoadedZone"

const PAGE_SIZE = 10

const SEARCH_NOTIFICATIONS = gql`query SearchNotifications($accountSearch: String, $dataSearch: String, $after: Cursor, $before: Cursor, $first: Int, $last: Int) {
  searchNotifications(
    accountSearch: $accountSearch
    dataSearch: $dataSearch
    first: $first
    last: $last
    after: $after
    before: $before
  ) {
    edges {
      node {
        id
        data
        created
        read
        accountsPublicDatumByAccountId {
          id
          name
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

const Notifications = () => {
    const [accountTerm, setAccountTerm] = useState('')
    const [dataTerm, setDataTerm] = useState('')
    
    const [debouncedAccountTerm] = useDebounce(accountTerm, 700)
    const [debouncedDataTerm] = useDebounce(dataTerm, 700)
    
    const [search, { data, loading, error }] = useLazyQuery(SEARCH_NOTIFICATIONS)
    const [paginationModel, setPaginationModel] = useState({ pageSize: PAGE_SIZE, page: 0 })

    useEffect(() => {
        search({ 
          variables: { 
            accountSearch: accountTerm, 
            dataSearch: dataTerm,
            first: PAGE_SIZE 
          } 
        })
    }, [debouncedAccountTerm, debouncedDataTerm])

    return <Stack gap={2}>
        <Stack direction="row" gap={2}>
          <TextField 
            label="Account Name" 
            id="accountTerm" 
            onChange={e => setAccountTerm(e.currentTarget.value)} 
            name="accountTerm" 
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <TextField 
            label="Data Search" 
            id="dataTerm" 
            onChange={e => setDataTerm(e.currentTarget.value)} 
            name="dataTerm"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
        <LoadedZone loading={loading} error={error}>
            { data && <DataGrid 
              paginationMode="server" 
              paginationModel={paginationModel} 
              rowCount={data.searchNotifications.totalCount} 
              columns={[
                { field: 'id', headerName: 'ID', width: 80 },
                { field: 'accountName', headerName: 'Account Name', width: 150, valueGetter: (value, row) => row.accountsPublicDatumByAccountId?.name },
                { field: 'data', headerName: 'Data', width: 400, valueGetter: (value, row) => typeof row.data === 'string' ? row.data : JSON.stringify(row.data) },
                { field: 'created', headerName: 'Created', width: 180, valueGetter: (value, row) => new Date(row.created).toLocaleString() },
                { field: 'read', headerName: 'Read', width: 180, valueGetter: (value, row) => row.read ? new Date(row.read).toLocaleString() : 'Not read' }
              ]}
              rows={data.searchNotifications.edges.map((sn: any) => sn.node)}
              getRowId={row => row.id}
              onPaginationModelChange={(model, details) => {
                if(model.page > paginationModel.page) {
                    if(!data.searchNotifications.pageInfo.hasNextPage) return
                    search({ 
                      variables: { 
                        accountSearch: accountTerm, 
                        dataSearch: dataTerm,
                        after: data.searchNotifications.pageInfo.endCursor, 
                        first: PAGE_SIZE 
                      } 
                    })
                } else {
                    if(!data.searchNotifications.pageInfo.hasPreviousPage) return
                    search({ 
                      variables: { 
                        accountSearch: accountTerm, 
                        dataSearch: dataTerm,
                        before: data.searchNotifications.pageInfo.startCursor, 
                        last: PAGE_SIZE 
                      } 
                    })
                }
                setPaginationModel({ pageSize: PAGE_SIZE, page: model.page })
              }} 
            /> } 
        </LoadedZone>
    </Stack>
}

export default Notifications
