'use client'

import { InputAdornment, Stack, TextField } from "@mui/material"
import { useEffect, useState } from "react"
import SearchIcon from '@mui/icons-material/Search'
import { useDebounce } from "use-debounce"
import { gql, useLazyQuery } from "@apollo/client"
import { DataGrid } from '@mui/x-data-grid'
import LoadedZone from "../scaffold/LoadedZone"

const PAGE_SIZE = 10

const SEARCH_MESSAGES = gql`query SearchMessages($resourceSearch: String, $accountSearch: String, $textSearch: String, $after: Cursor, $before: Cursor, $first: Int, $last: Int) {
  searchMessages(
    resourceSearch: $resourceSearch
    accountSearch: $accountSearch
    textSearch: $textSearch
    first: $first
    last: $last
    after: $after
    before: $before
  ) {
    edges {
      node {
        id
        text
        created
        participantByParticipantId {
          id
          accountId
          accountsPublicDatumByAccountId {
            id
            name
          }
          conversationByConversationId {
            id
            resourceByResourceId {
              id
              title
            }
            participantsByConversationId(first: 10) {
              edges {
                node {
                  accountId
                  accountsPublicDatumByAccountId {
                    id
                    name
                  }
                }
              }
            }
          }
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

const getDestinator = (participant: any) => {
  const conv = participant?.conversationByConversationId
  if(!conv) return null
  const participants = conv.participantsByConversationId?.edges?.map((e: any) => e.node) || []
  const other = participants.find((p: any) => p.accountId !== participant.accountId)
  return other?.accountsPublicDatumByAccountId?.name || null
}

const Messages = () => {
  const [resourceTerm, setResourceTerm] = useState('')
  const [accountTerm, setAccountTerm] = useState('')
  const [textTerm, setTextTerm] = useState('')

  const [debouncedResourceTerm] = useDebounce(resourceTerm, 700)
  const [debouncedAccountTerm] = useDebounce(accountTerm, 700)
  const [debouncedTextTerm] = useDebounce(textTerm, 700)

  const [search, { data, loading, error }] = useLazyQuery(SEARCH_MESSAGES)
  const [paginationModel, setPaginationModel] = useState({ pageSize: PAGE_SIZE, page: 0 })

  useEffect(() => {
    search({ variables: { resourceSearch: resourceTerm, accountSearch: accountTerm, textSearch: textTerm, first: PAGE_SIZE } })
  }, [debouncedResourceTerm, debouncedAccountTerm, debouncedTextTerm])

  return <Stack gap={2}>
    <Stack direction="row" gap={2}>
      <TextField label="Account Name" id="accountTerm" onChange={e => setAccountTerm(e.currentTarget.value)} name="accountTerm" size="small" InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon/></InputAdornment>) }} />
      <TextField label="Resource Name" id="resourceTerm" onChange={e => setResourceTerm(e.currentTarget.value)} name="resourceTerm" size="small" InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon/></InputAdornment>) }} />
      <TextField label="Text" id="textTerm" onChange={e => setTextTerm(e.currentTarget.value)} name="textTerm" size="small" InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon/></InputAdornment>) }} />
    </Stack>
    <LoadedZone loading={loading} error={error}>
      { data && <DataGrid
        paginationMode="server"
        paginationModel={paginationModel}
        rowCount={data.searchMessages.totalCount}
        columns={[
          { field: 'id', headerName: 'ID', width: 80 },
          { field: 'created', headerName: 'Created', width: 180, valueGetter: (v,row) => new Date(row.created).toLocaleString() },
          { field: 'author', headerName: 'Author', width: 180, valueGetter: (v,row) => row.participantByParticipantId?.accountsPublicDatumByAccountId?.name },
          { field: 'destinator', headerName: 'Destinator', width: 180, valueGetter: (v,row) => getDestinator(row.participantByParticipantId) },
          { field: 'resource', headerName: 'Resource', width: 220, valueGetter: (v,row) => row.participantByParticipantId?.conversationByConversationId?.resourceByResourceId?.title },
          { field: 'text', headerName: 'Text', width: 400 }
        ]}
        rows={data.searchMessages.edges.map((m: any) => m.node)}
        getRowId={row => row.id}
        onPaginationModelChange={(model, details) => {
          if(model.page > paginationModel.page) {
            if(!data.searchMessages.pageInfo.hasNextPage) return
            search({ variables: { resourceSearch: resourceTerm, accountSearch: accountTerm, textSearch: textTerm, after: data.searchMessages.pageInfo.endCursor, first: PAGE_SIZE } })
          } else {
            if(!data.searchMessages.pageInfo.hasPreviousPage) return
            search({ variables: { resourceSearch: resourceTerm, accountSearch: accountTerm, textSearch: textTerm, before: data.searchMessages.pageInfo.startCursor, last: PAGE_SIZE } })
          }
          setPaginationModel({ pageSize: PAGE_SIZE, page: model.page })
        }}
      /> }
    </LoadedZone>
  </Stack>
}

export default Messages
