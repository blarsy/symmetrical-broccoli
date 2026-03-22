'use client'

import { InputAdornment, Stack, TextField } from "@mui/material"
import { useEffect, useState } from "react"
import SearchIcon from '@mui/icons-material/Search'
import { useDebounce } from "use-debounce"
import { gql, useLazyQuery } from "@apollo/client"
import { DataGrid } from '@mui/x-data-grid'
import LoadedZone from "../scaffold/LoadedZone"

const PAGE_SIZE = 10

const SEARCH_RESOURCES = gql`query SearchResources($resourceSearch: String, $ownerSearch: String, $after: Cursor, $before: Cursor, $first: Int, $last: Int) {
  searchResources(
    resourceSearch: $resourceSearch
    ownerSearch: $ownerSearch
    first: $first
    last: $last
    after: $after
    before: $before
  ) {
    edges {
      node {
        id
        title
        price
        created
        expiration
        isProduct
        isService
        canBeDelivered
        canBeTakenAway
        canBeExchanged
        canBeGifted
        accountsPublicDatumByAccountId {
          id
          name
        }
        resourcesImagesByResourceId(first: 1000) {
          totalCount
        }
        locationBySpecificLocationId {
          address
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

const Resources = () => {
    const [resourceTerm, setResourceTerm] = useState('')
    const [ownerTerm, setOwnerTerm] = useState('')
    
    const [debouncedResourceTerm] = useDebounce(resourceTerm, 700)
    const [debouncedOwnerTerm] = useDebounce(ownerTerm, 700)
    
    const [search, { data, loading, error }] = useLazyQuery(SEARCH_RESOURCES)
    const [paginationModel, setPaginationModel] = useState({ pageSize: PAGE_SIZE, page: 0 })

    useEffect(() => {
        search({ 
          variables: { 
            resourceSearch: resourceTerm, 
            ownerSearch: ownerTerm,
            first: PAGE_SIZE 
          } 
        })
    }, [debouncedResourceTerm, debouncedOwnerTerm])

    return <Stack gap={2}>
        <Stack direction="row" gap={2}>
          <TextField 
            label="Resource Name" 
            id="resourceTerm" 
            onChange={e => setResourceTerm(e.currentTarget.value)} 
            name="resourceTerm" 
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
            label="Owner Name" 
            id="ownerTerm" 
            onChange={e => setOwnerTerm(e.currentTarget.value)} 
            name="ownerTerm"
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
              rowCount={data.searchResources.totalCount} 
              columns={[
                { field: 'id', headerName: 'Resource ID', width: 120 },
                { field: 'title', headerName: 'Title', width: 200 },
                { field: 'ownerName', headerName: 'Owner Name', width: 150, valueGetter: (value, row) => row.accountsPublicDatumByAccountId?.name },
                { field: 'ownerId', headerName: 'Owner ID', width: 120, valueGetter: (value, row) => row.accountsPublicDatumByAccountId?.id },
                { field: 'price', headerName: 'Price', width: 100 },
                { field: 'imageCount', headerName: '# Images', width: 100, valueGetter: (value, row) => row.resourcesImagesByResourceId?.totalCount || 0 },
                { field: 'address', headerName: 'Location', width: 200, valueGetter: (value, row) => row.locationBySpecificLocationId?.address || 'N/A' },
                { field: 'created', headerName: 'Created', width: 180, valueGetter: (value, row) => new Date(row.created).toLocaleString() },
                { field: 'expiration', headerName: 'Expires', width: 180, valueGetter: (value, row) => new Date(row.expiration).toLocaleString() },
                { field: 'isProduct', headerName: 'Product', width: 80, type: 'boolean' },
                { field: 'isService', headerName: 'Service', width: 80, type: 'boolean' },
                { field: 'canBeDelivered', headerName: 'Delivered', width: 90, type: 'boolean' },
                { field: 'canBeTakenAway', headerName: 'Taken Away', width: 100, type: 'boolean' },
                { field: 'canBeExchanged', headerName: 'Exchanged', width: 100, type: 'boolean' },
                { field: 'canBeGifted', headerName: 'Gifted', width: 80, type: 'boolean' }
              ]}
              rows={data.searchResources.edges.map((sr: any) => sr.node)}
              getRowId={row => row.id}
              onPaginationModelChange={(model, details) => {
                if(model.page > paginationModel.page) {
                    if(!data.searchResources.pageInfo.hasNextPage) return
                    search({ 
                      variables: { 
                        resourceSearch: resourceTerm, 
                        ownerSearch: ownerTerm,
                        after: data.searchResources.pageInfo.endCursor, 
                        first: PAGE_SIZE 
                      } 
                    })
                } else {
                    if(!data.searchResources.pageInfo.hasPreviousPage) return
                    search({ 
                      variables: { 
                        resourceSearch: resourceTerm, 
                        ownerSearch: ownerTerm,
                        before: data.searchResources.pageInfo.startCursor, 
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

export default Resources
