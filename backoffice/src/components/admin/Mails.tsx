import { Button, Dialog, DialogContent, DialogTitle, IconButton, InputAdornment, Stack, TextField, Typography } from "@mui/material"
import { useEffect, useState } from "react"
import SearchIcon from '@mui/icons-material/Search'
import { useDebounce } from "use-debounce"
import { gql, useLazyQuery } from "@apollo/client"
import { DataGrid } from '@mui/x-data-grid'
import LoadedZone from "../scaffold/LoadedZone"
import Close from "@mui/icons-material/Close"

const PAGE_SIZE = 10
const SEARCH_MAILS = gql`query SearchMails($searchTerm: String, $last: Int, $first: Int, $before: Cursor, $after: Cursor) {
  searchMails(
    after: $after
    before: $before
    first: $first
    last: $last
    searchTerm: $searchTerm
  ) {
    edges {
      node {
        accountByAccountId {
          name
        }
        created
        email
        htmlContent
        id
        subject
        textContent
        sentFrom
      }
    }
    pageInfo {
      endCursor
      hasNextPage
      hasPreviousPage
      startCursor
    }
    totalCount
  }
}`

interface MailInfo {
    subject: string
    from: string
    to: string
    htmlContent: string
    date: Date
}

interface ViewMailDialogProps {
    mailInfo?: MailInfo
    onClose: () => void
}

const ViewMailDialog = (p: ViewMailDialogProps) => {
    return <Dialog open={!!p.mailInfo} onClose={p.onClose} maxWidth="xl" fullWidth fullScreen sx={{ height: '100%' }}>
        <DialogTitle sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography>{p.mailInfo?.from} to {p.mailInfo?.to}, {p.mailInfo?.date.toLocaleString()}</Typography>
            <IconButton onClick={p.onClose}>
                <Close/>
            </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <Typography variant="body1">From {p.mailInfo?.from}</Typography>
            <Typography variant="body1">To {p.mailInfo?.to}</Typography>
            <Typography variant="body1">Subject {p.mailInfo?.subject}</Typography>
            <iframe style={{flex: 1}} srcDoc={p.mailInfo?.htmlContent}/>
        </DialogContent>
    </Dialog>
}

const Mails = () => {
    const [term, setTerm] = useState('')
    const [debouncedTerm] = useDebounce(term, 700)
    const [search, { data, loading, error }] = useLazyQuery(SEARCH_MAILS)
    const [paginationModel, setPaginationModel] = useState({ pageSize: PAGE_SIZE, page: 0 })
    const [mailToView, setMailToView] = useState<MailInfo | undefined>()

    useEffect(() => {
        search({ variables: { searchTerm: term, first: PAGE_SIZE } })
    }, [debouncedTerm])

    return <Stack gap="1rem">
        <TextField label="Search" id="term" onChange={e => setTerm(e.currentTarget.value)} name="term" 
        InputProps={{
          endAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}/>
        <LoadedZone loading={loading} error={error}>
            { data && <DataGrid paginationMode="server" paginationModel={paginationModel} rowCount={data.searchMails.totalCount} columns={[
                { field: 'id', headerName: 'Id'},
                { field: 'email', headerName: 'Target'},
                { field: 'subject', headerName: 'Subject'},
                { field: 'account', headerName: 'Account', valueGetter: (val: any, row: any) => row.accountByAccountId?.name},
                { field: 'created', headerName: 'Date Création'},
                { field: 'action', headerName: 'Actions', renderCell: data => <Button variant="contained"
                    onClick={() => setMailToView({ to: data.row.email, from: data.row.sentFrom, 
                        subject: data.row.subject, htmlContent: data.row.htmlContent, date: data.row.created })}>View</Button>}
            ]}
            rows={data.searchMails.edges.map((sa: any) => sa.node)}
            onPaginationModelChange={(model) => {
                if(model.page > paginationModel.page) {
                    if(!data.searchMails.pageInfo.hasNextPage) return
                    search({ variables: { searchTerm: term, after: data.searchMails.pageInfo.endCursor, first: PAGE_SIZE } })
                } else {
                    if(!data.searchMails.pageInfo.hasPreviousPage) return
                    search({ variables: { searchTerm: term, before: data.searchMails.pageInfo.startCursor, last: PAGE_SIZE } })
                }
                setPaginationModel({ pageSize: PAGE_SIZE, page: model.page })
            }} /> } 
        </LoadedZone>
        <ViewMailDialog mailInfo={mailToView} onClose={() => setMailToView(undefined)}/>
    </Stack>
}

export default Mails