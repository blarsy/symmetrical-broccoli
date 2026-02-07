import { useContext, useState } from "react"
import { UiContext } from "../scaffold/UiContextProvider"
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material"
import { gql, useMutation } from "@apollo/client"
import { ConfirmDialog, ErrorText } from "../misc"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { LoadingButton } from "@mui/lab"
import Feedback from "../scaffold/Feedback"
import { ErrorMessage, Formik } from "formik"
import * as yup from "yup"
import { AppContext } from "../scaffold/AppContextProvider"

const SEND_TOKENS = gql`mutation SendTokens($amountToSend: Int, $targetAccountId: UUID) {
    sendTokens(
      input: {amountToSend: $amountToSend, targetAccountId: $targetAccountId}
    ) {
      integer
    }
}`

export interface TokenTransferInfo {
    destinatorAccount: string
    destinatorId: string
    defaultAmount?: number
}

interface Props {
    transferInfo?: TokenTransferInfo
    onClose: () => void
}

const TransferTokensDialog = (p: Props) => {
    const uiContext = useContext(UiContext)
    const appContext = useContext(AppContext)
    const [sendTokens] = useMutation(SEND_TOKENS)
    const [confirming, setConfirming] = useState(false)
    const [sendingStatus, setSendingStatus] = useState<DataLoadState<undefined>>(initial(false))

    const t = uiContext.i18n.translator

    return <Formik initialValues={{ amountOfTokens: p.transferInfo?.defaultAmount || 1 }}
            onSubmit={async values => {
                setSendingStatus(initial(true))
                setConfirming(false)
                try {
                    const res = await sendTokens({ variables: { amountToSend: values.amountOfTokens, targetAccountId: p.transferInfo?.destinatorId } })
                    if(res.data.sendTokens.integer === 2) {
                        setSendingStatus(fromError(new Error('Insufficient amount of token on source account'), t('insufficientTokenAmount')))
                    } else {
                        setSendingStatus(fromData(undefined))
                        p.onClose()
                    }
                } catch(e) {
                    setSendingStatus(fromError(e, t('requestError')))
                }
            }} validationSchema={yup.object().shape({
                amountOfTokens: yup.number().required(t('required_field')).integer(t('mustBeAnInteger'))
                    .min(1, t('mustBeAValidNumber'))
                    .max(appContext.account!.amountOfTokens, t('cannotSendMoreThanWhatYouHave', {max: appContext.account!.amountOfTokens})),
        })}>
            { ({ handleSubmit, handleChange, handleBlur, values }) =>
            <>
                <Dialog open={!!p.transferInfo?.destinatorAccount} onClose={p.onClose}>
                    <DialogTitle>{t('transferTokensDialogTitle', { destinatorAccount: p.transferInfo?.destinatorAccount })}</DialogTitle>
                    <DialogContent sx={{ display: 'flex' }}>
                        <TextField sx={{ flex: 1 }} value={values.amountOfTokens} type="number" onChange={handleChange('amountOfTokens')}
                            onBlur={handleBlur('amountOfTokens')}/>
                        <ErrorMessage component={ErrorText} name="amountOfTokens" />
                        <Feedback severity="error" detail={sendingStatus.error?.detail} message={sendingStatus.error?.message}
                            onClose={() => setSendingStatus(initial(false))} visible={!!sendingStatus.error}/>
                    </DialogContent>
                    <DialogActions>
                        <LoadingButton loading={sendingStatus.loading} disabled={sendingStatus.loading} onClick={ p.onClose }>{t('cancelButton')}</LoadingButton>
                        <Button onClick={ () => {
                            setConfirming(true)
                        }}>{t('okButton')}</Button>
                    </DialogActions>
                </Dialog>
                <ConfirmDialog onClose={async response => {
                    if(response) {
                        await handleSubmit()
                    } else {
                        setConfirming(false)
                    }
                }} title={t('confirmSendTokens', { amount: values.amountOfTokens, destinatorAccount: p.transferInfo?.destinatorAccount })}
                visible={confirming} /> 
            </> }
    </Formik>
}

export default TransferTokensDialog