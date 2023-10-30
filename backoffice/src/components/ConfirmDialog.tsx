import { beginOperation, fromData, fromError, initial } from "@/DataLoadState"
import { Alert, Backdrop, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Stack } from "@mui/material"
import { useState } from "react"

interface Props {
    onClose: (response: boolean) => Promise<void>
    opened: boolean
    title: string
    question: string
}

const ConfirmDialog = ({ onClose, opened, title, question }: Props) => {
    const [processing, setProcessing] = useState(initial<null>(false))
    return <Stack>
        <Dialog
            open={opened}
            onClose={() => onClose(false)}>
            <DialogTitle>
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {question}
                </DialogContentText>
                { processing.error && <Alert severity="error">{processing.error?.message}</Alert> }
            </DialogContent>
            <DialogActions>
                <Button onClick={() => onClose(false)} autoFocus>Non</Button>
                <Button onClick={async () => {
                    setProcessing(beginOperation())
                    try {
                        await onClose(true)
                        setProcessing(fromData(null))
                    } catch(e) {
                        setProcessing(fromError(e, 'Erreur pendant l\'exécution de la requête.'))
                    }
                }}>Oui</Button>
            </DialogActions>
        </Dialog>
        <Backdrop
            open={processing.loading}>
            <CircularProgress sx={{ color: 'primary.light'}} />
        </Backdrop>
    </Stack>
}

export default ConfirmDialog