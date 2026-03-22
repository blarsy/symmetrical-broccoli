'use client'

import { InputAdornment, Stack, TextField } from "@mui/material"
import { useEffect, useState } from "react"
import SearchIcon from '@mui/icons-material/Search'
import { useDebounce } from "use-debounce"
import { gql, useLazyQuery } from "@apollo/client"
import { DataGrid } from '@mui/x-data-grid'
import LoadedZone from "../scaffold/LoadedZone"

const PAGE_SIZE = 10

const SEARCH_BIDS = gql`query SearchBids($bidderSearch: String, $receiverSearch: String, $resourceSearch: String, $after: Cursor, $before: Cursor, $first: Int, $last: Int) {
  searchBids(
    bidderSearch: $bidderSearch
    receiverSearch: $receiverSearch
    resourceSearch: $resourceSearch
    first: $first
    last: $last
    after: $after
    before: $before
  ) {
    edges {
      node {
        id
        amountOfTokens
        validUntil
        created
        accepted
        deleted
        refused
        resourceByResourceId {
          id
          title
          accountsPublicDatumByAccountId {
            id
            name
          }
        }
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

const getBidStatus = (bid: any): string => {
  if (bid.deleted) return 'cancelled'
  if (bid.accepted) return 'accepted'
  if (bid.refused) return 'refused'
  if (new Date(bid.validUntil) < new Date()) return 'expired'
  return 'sent'
}

const Bids = () => {
    const [bidderTerm, setBidderTerm] = useState('')
    const [receiverTerm, setReceiverTerm] = useState('')
    const [resourceTerm, setResourceTerm] = useState('')
    
    const [debouncedBidderTerm] = useDebounce(bidderTerm, 700)
    const [debouncedReceiverTerm] = useDebounce(receiverTerm, 700)
    const [debouncedResourceTerm] = useDebounce(resourceTerm, 700)
    
    const [search, { data, loading, error }] = useLazyQuery(SEARCH_BIDS)
    const [paginationModel, setPaginationModel] = useState({ pageSize: PAGE_SIZE, page: 0 })

    useEffect(() => {
        search({ 
          variables: { 
            bidderSearch: bidderTerm, 
            receiverSearch: receiverTerm,
            resourceSearch: resourceTerm,
            first: PAGE_SIZE 
          } 
        })
    }, [debouncedBidderTerm, debouncedReceiverTerm, debouncedResourceTerm])

    return <Stack gap={2}>
        <Stack direction="row" gap={2}>
          <TextField 
            label="Bidder Name" 
            id="bidderTerm" 
            onChange={e => setBidderTerm(e.currentTarget.value)} 
            name="bidderTerm" 
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
            label="Receiver Name" 
            id="receiverTerm" 
            onChange={e => setReceiverTerm(e.currentTarget.value)} 
            name="receiverTerm"
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
        </Stack>
        <LoadedZone loading={loading} error={error}>
            { data && <DataGrid 
              paginationMode="server" 
              paginationModel={paginationModel} 
              rowCount={data.searchBids.totalCount} 
              columns={[
                { field: 'id', headerName: 'Bid ID', width: 80 },
                { field: 'bidderName', headerName: 'Bidder Name', width: 150, valueGetter: (value, row) => row.accountsPublicDatumByAccountId?.name },
                { field: 'receiverName', headerName: 'Receiver Name', width: 150, valueGetter: (value, row) => row.resourceByResourceId?.accountsPublicDatumByAccountId?.name },
                { field: 'resourceName', headerName: 'Resource Name', width: 150, valueGetter: (value, row) => row.resourceByResourceId?.title },
                { field: 'amountOfTokens', headerName: 'Tokens', width: 100 },
                { field: 'status', headerName: 'Status', width: 100, valueGetter: (value, row) => getBidStatus(row) },
                { field: 'created', headerName: 'Created', width: 180, valueGetter: (value, row) => new Date(row.created).toLocaleString() },
                { field: 'validUntil', headerName: 'Expires', width: 180, valueGetter: (value, row) => new Date(row.validUntil).toLocaleString() }
              ]}
              rows={data.searchBids.edges.map((sb: any) => sb.node)}
              getRowId={row => row.id}
              onPaginationModelChange={(model, details) => {
                if(model.page > paginationModel.page) {
                    if(!data.searchBids.pageInfo.hasNextPage) return
                    search({ 
                      variables: { 
                        bidderSearch: bidderTerm, 
                        receiverSearch: receiverTerm,
                        resourceSearch: resourceTerm,
                        after: data.searchBids.pageInfo.endCursor, 
                        first: PAGE_SIZE 
                      } 
                    })
                } else {
                    if(!data.searchBids.pageInfo.hasPreviousPage) return
                    search({ 
                      variables: { 
                        bidderSearch: bidderTerm, 
                        receiverSearch: receiverTerm,
                        resourceSearch: resourceTerm,
                        before: data.searchBids.pageInfo.startCursor, 
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

export default Bids
