import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material"
import { useContext, useState } from "react"
import { UiContext } from "../scaffold/UiContextProvider"
import { LoadingButton } from "@mui/lab"
import Feedback from "../scaffold/Feedback"
import ResourceHeader from "../resources/ResourceHeader"
import { Resource } from "@/lib/schema"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { ErrorMessage, Formik } from "formik"
import * as yup from "yup"
import { gql, useMutation } from "@apollo/client"
import { ErrorText } from "../misc"
import { AppContext } from "../scaffold/AppContextProvider"

export const CREATE_BID = gql`mutation CreateBid($amountOfTokens: Int, $hoursValid: Int, $resourceId: Int) {
  createBid(
    input: {amountOfTokens: $amountOfTokens, hoursValid: $hoursValid, resourceId: $resourceId}
  ) {
    integer
  }
}`

interface Props {
    resource?: Resource
    onClose: (sucess?: boolean) => void
}

const CreateBidDialog = (p: Props) => {
    const uiContext = useContext(UiContext)
    const appContext = useContext(AppContext)
    const [bidStatus, setBidStatus] = useState<DataLoadState<undefined>>(initial(false))
    const [createBid] = useMutation(CREATE_BID)

    const t = uiContext.i18n.translator

    return <Formik initialValues={{ amountOfTokens: p.resource?.price || 0, hoursValid: 12 }}
        onSubmit={async values => {
            setBidStatus(initial(true))
            try {
                const res = await createBid({ variables: { amountOfTokens: values.amountOfTokens, hoursValid: values.hoursValid, resourceId: p.resource!.id } })
                if(res.data.createBid.integer && res.data.createBid.integer < 0) {
                    throw new Error('Unexpected return value on bid creation')
                } else {
                    setBidStatus(fromData(undefined))
                    p.onClose(true)
                }
            } catch(e) {
                setBidStatus(fromError(e, t('requestError')))
            }
        }} validationSchema={yup.object().shape({
            amountOfTokens: yup.number().required(t('required_field')).integer(t('mustBeAnInteger'))
                .min(1, t('mustBeAValidNumber'))
                .max(appContext.account!.amountOfTokens, t('cannotSendMoreThanWhatYouHave', {max: appContext.account!.amountOfTokens})),
            hoursValid: yup.number().required(t('required_field')).integer(t('mustBeAnInteger')).min(1, t('mustBeAValidNumber')).max(48, t('max48Hours'))
    })}>
        { ({ handleSubmit, handleChange, handleBlur, values }) =>
        <Dialog open={!!p.resource} onClose={() => p.onClose(false)} maxWidth="md" fullWidth>
            <DialogTitle>{t('createBidDialogTitle')}</DialogTitle>
            <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <ResourceHeader data={{ id: p.resource!.id,
                    resource: p.resource,
                    participantId: 0, // not used in this component's context
                    otherAccount: 
                        { 
                            participantId: 0, // not used in this component's context
                            id: p.resource!.account!.id,
                            name: p.resource!.account!.name,
                            avatarImageUrl: p.resource!.account!.avatarImageUrl
                        } 
                    }}/>
                <TextField inputProps={{
                    'data-testid': 'AmountOfTokenField'
                }} label={t('amountOfTokenLabel')}  sx={{ flex: 1 }} value={values.amountOfTokens} 
                    type="number" required onChange={handleChange('amountOfTokens')} 
                    onBlur={handleBlur('amountOfTokens')}/>
                <ErrorMessage component={ErrorText} name="amountOfTokens" />
                <TextField label={t('hoursValidLabel')} sx={{ flex: 1 }} value={values.hoursValid} 
                    type="number" required onChange={handleChange('hoursValid')} onBlur={handleBlur('hoursValid')}/>
                <ErrorMessage component={ErrorText} name="hoursValid" />
                <Feedback severity="error" detail={bidStatus.error?.detail} message={bidStatus.error?.message}
                    onClose={() => setBidStatus(initial(false))} visible={!!bidStatus.error}/>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => p.onClose() }>{t('cancelButton')}</Button>
                <LoadingButton data-testid="CreateBidButton" loading={bidStatus.loading} disabled={bidStatus.loading} onClick={() => {
                    handleSubmit()
                }}>{t('okButton')}</LoadingButton>
            </DialogActions>
        </Dialog>}
    </Formik>
}

export default CreateBidDialog