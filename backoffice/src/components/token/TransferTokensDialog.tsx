import { useContext, useState } from "react"
import { UiContext } from "../scaffold/UiContextProvider"
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material"
import { gql, useMutation } from "@apollo/client"
import { ConfirmDialog } from "../misc"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { LoadingButton } from "@mui/lab"
import Feedback from "../scaffold/Feedback"

const SEND_TOKENS = gql`mutation SendTokens($amountToSend: Int, $targetAccountId: Int) {
    sendTokens(
      input: {amountToSend: $amountToSend, targetAccountId: $targetAccountId}
    ) {
      integer
    }
}`

export interface TokenTransferInfo {
    destinatorAccount: string
    destinatorId: number
    defaultAmount?: number
}

interface Props {
    transferInfo?: TokenTransferInfo
    onClose: () => void
}

const TransferTokensDialog = (p: Props) => {
    const uiContext = useContext(UiContext)
    const [sendTokens] = useMutation(SEND_TOKENS)
    const [amount, setAmount] = useState(p.transferInfo?.defaultAmount || 0)
    const [confirming, setConfirming] = useState(false)
    const [sendingStatus, setSendingStatus] = useState<DataLoadState<undefined>>(initial(false))

    return <>
        <Dialog open={!!p.transferInfo?.destinatorAccount} onClose={p.onClose}>
            <DialogTitle>{uiContext.i18n.translator('transferTokensDialogTitle', { destinatorAccount: p.transferInfo?.destinatorAccount })}</DialogTitle>
            <DialogContent sx={{ display: 'flex' }}>
                <TextField sx={{ flex: 1 }} value={amount} type="number" required onChange={e => setAmount(Number(e.currentTarget.value))}/>
            </DialogContent>
            <DialogContent>
                <Feedback severity="error" detail={sendingStatus.error?.detail} message={sendingStatus.error?.message}
                    onClose={() => setSendingStatus(initial(false))} visible={!!sendingStatus.error}/>
            </DialogContent>
            <DialogActions>
                <LoadingButton loading={sendingStatus.loading} disabled={sendingStatus.loading} onClick={ p.onClose }>{uiContext.i18n.translator('cancelButton')}</LoadingButton>
                <Button disabled={!amount || amount <= 0} onClick={ () => {
                    setConfirming(true)
                }}>{uiContext.i18n.translator('okButton')}</Button>
            </DialogActions>
        </Dialog>
        <ConfirmDialog onClose={async response => {
            if(response) {
                setSendingStatus(initial(true))
                setConfirming(false)
                try {
                    const res = await sendTokens({ variables: { amountToSend: amount, targetAccountId: p.transferInfo?.destinatorId } })
                    if(res.data.sendTokens.integer === 2) {
                        setSendingStatus(fromError(new Error('Insufficient amount of token on source account'), uiContext.i18n.translator('insufficientTokenAmount')))
                    } else {
                        setSendingStatus(fromData(undefined))
                        p.onClose()
                    }
                } catch(e) {
                    setSendingStatus(fromError(e, uiContext.i18n.translator('requestError')))
                }
            } else {
                setConfirming(false)
            }
        }} title={uiContext.i18n.translator('confirmSendTokens', { amount, destinatorAccount: p.transferInfo?.destinatorAccount })}
        visible={confirming} />
    </>
}

export default TransferTokensDialog