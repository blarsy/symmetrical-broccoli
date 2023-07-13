import DataLoadState, { beginOperation, fromData, fromError, initial } from "@/app/DataLoadState"
import { LoadingButton } from "@mui/lab"
import { Button, Typography, Tooltip, Dialog, DialogActions, DialogContent } from "@mui/material"
import { Box } from "@mui/system"
import LoadingList from "../LoadingList"
import AddIcon from '@mui/icons-material/Add'
import QuestionIcon from '@mui/icons-material/QuestionMark'
import DeleteIcon from '@mui/icons-material/Delete'
import { Account } from "@/schema"
import axios from "axios"
import Feedback from "../Feedback"
import SearchAccount from "./SearchAccount"
import { useState } from "react"

interface Props {
    linkedAccountRequestsState: DataLoadState<Account[]>
    onErrorClosed: () => void
    onLinksChanged: () => Promise<void>
}

const RequestedLinks = ({ linkedAccountRequestsState, onErrorClosed, onLinksChanged }: Props) => {
    const [addLinkRequestOpen, setAddLinkRequestOpen] = useState(false)
    const [changeLinkRequestError, setChangeLinkRequestError] = useState('')
    const [deleteState, setDeleteState] = useState(initial<null>(false))

    return <Box display="flex" flexDirection="column" alignItems="stretch">
        <Button sx={{ alignSelf: 'center' }} startIcon={<AddIcon />} onClick={() => setAddLinkRequestOpen(true)}>Inviter</Button>
        <LoadingList loadState={linkedAccountRequestsState} displayItem={item => {
            return <Box display="flex" flexDirection="row" justifyContent="space-between">
                <LoadingButton loading={deleteState.loading} onClick={async () => {
                        try {
                            setDeleteState(beginOperation())
                            await axios.delete(`/api/user/linkrequest?target=${item.id}`, { headers: { Authorization: localStorage.getItem('token') }})
                            await onLinksChanged()
                            setDeleteState(fromData(null))
                        } catch(e: any) {
                            setDeleteState(fromError(e, 'Erreur pendant l\'effacement de l\'invitation'))
                        }
                }}><DeleteIcon /></LoadingButton>
                <Typography variant="body1">{item.name} ({item.email})</Typography>
                <Tooltip title="En attente d'acceptation par la cible."><QuestionIcon /></Tooltip>
            </Box>}} onErrorClosed={onErrorClosed} />
            { deleteState.error?.message && <Feedback severity="error" message={deleteState.error.message!} detail={deleteState.error.detail} /> }
            <Dialog open={addLinkRequestOpen} sx={{ minWidth: 'sm' }}>
                <DialogContent>
                    <SearchAccount onSelect={async (account: Account) => {
                        try {
                            await axios.post('/api/user/linkrequest', { target: account.id }, { headers: { Authorization: localStorage.getItem('token') }})
                            await onLinksChanged()
                            setAddLinkRequestOpen(false)
                        } catch(e: any) {
                            setChangeLinkRequestError(e.toString())
                        }
                    }} />
                    { changeLinkRequestError && <Feedback severity="error" 
                        message="Erreur pendant l'envoi de la demande" detail={changeLinkRequestError} 
                        onClose={() => setChangeLinkRequestError('')} />}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddLinkRequestOpen(false)}>Annuler</Button>
                </DialogActions>
            </Dialog>
    </Box>
}
export default RequestedLinks