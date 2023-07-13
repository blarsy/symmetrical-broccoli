import { Box, CircularProgress, IconButton, Tab, Tabs, Typography } from "@mui/material"
import LoadingList from "../LoadingList"
import { beginOperation, fromData, fromError, initial } from "@/app/DataLoadState"
import { useEffect, useState } from "react"
import { Account } from "@/schema"
import axios from "axios"
import RequestedLinks from "./RequestedLinks"
import DeleteIcon from '@mui/icons-material/Delete'
import AcceptIcon from '@mui/icons-material/PersonAdd'

const Network = () => {
    const [linkedAccountRequestsState, setLinkedAccountRequestsState] = useState(initial<Account[]>(true))
    const [linkedAccountsState, setLinkedAccountsState] = useState(initial<Account[]>(true))
    const [linkedAccountRequestsReceivedState, setLinkedAccountRequestsReceivedState] = useState(initial<Account[]>(true))
    const [currentTab, setCurrentTab] = useState(0)
    const [requestProcessingState, setRequestProcessingState] = useState(initial<null>(false))
    const load = async () => {
        try {
            const res = await axios.get('/api/user/network', { headers: { Authorization: localStorage.getItem('token') }})
            setLinkedAccountRequestsState(fromData(res.data.linkRequests))
            setLinkedAccountsState(fromData(res.data.linkedAccounts))
            setLinkedAccountRequestsReceivedState(fromData(res.data.receivedLinkRequests))
        } catch(e: any) {
            setLinkedAccountRequestsState(fromError(e, 'Erreur au chargement des données'))
            setLinkedAccountsState(fromError(e, 'Erreur au chargement des données'))
            setLinkedAccountRequestsReceivedState(fromError(e, 'Erreur au chargement des données'))
        }
    }

    useEffect(() => {
        load()
    }, [])

    return <Box display="flex" flexDirection="column">
        <Typography variant="h2">Mon réseau</Typography>
        <Tabs value={currentTab} onChange={(_, idx) => setCurrentTab(idx)}>
          <Tab label="Demandes envoyées" />
          <Tab label="Comptes liés" />
          <Tab label="Demandes reçues" />
        </Tabs>
        { currentTab === 0 && <RequestedLinks onErrorClosed={() => { setLinkedAccountRequestsState(fromData([])) }} 
            linkedAccountRequestsState={linkedAccountRequestsState} onLinksChanged={async () => await load()}/> }
        { currentTab === 1 && <Box>
           <LoadingList loadState={linkedAccountsState} displayItem={item => {
                return <Typography variant="body1">{item.name} ({item.email})</Typography>
            }} onErrorClosed={() => { setLinkedAccountsState(fromData([])) }} />
        </Box> }
        { currentTab === 2 && <Box>
            <LoadingList loadState={linkedAccountRequestsReceivedState} displayItem={item => {
                return <Box display="flex" flexDirection="row" justifyContent="space-between">
                    <Typography variant="body1">{item.name} ({item.email})</Typography>
                    {requestProcessingState.loading && <CircularProgress size="1rem" />}
                    <Box>
                        <IconButton onClick={async () => {
                            try {
                                setRequestProcessingState(beginOperation())
                                await axios.patch('/api/user/linkrequest', { target: item.id, accept: 1 }, { headers: { Authorization: localStorage.getItem('token') }})
                                setRequestProcessingState(fromData(null))
                                await load()
                            } catch(e: any) {
                                setRequestProcessingState(fromError(e, 'Erreur pendant l\'exécution de l\'opération'))
                            }
                        }}><AcceptIcon/></IconButton>
                        <IconButton onClick={async () => {
                            try {
                                setRequestProcessingState(beginOperation())
                                await axios.patch('/api/user/linkrequest', { target: item.id, accept: 0 }, { headers: { Authorization: localStorage.getItem('token') }})
                                setRequestProcessingState(fromData(null))
                                await load()
                            } catch(e: any) {
                                setRequestProcessingState(fromError(e, 'Erreur pendant l\'exécution de l\'opération'))
                            }  
                        }}><DeleteIcon/></IconButton>
                    </Box>
                </Box>
            }} onErrorClosed={() => { setLinkedAccountRequestsReceivedState(fromData([])) }} />
        </Box> }
    </Box>
}

export default Network