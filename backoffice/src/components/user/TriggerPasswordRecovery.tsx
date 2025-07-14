import { ErrorMessage, Form, Formik } from "formik"
import * as yup from 'yup'
import { UiContext } from "../scaffold/UiContextProvider"
import { useContext, useState } from "react"
import { Alert, Button, Stack, TextField } from "@mui/material"
import { ErrorText } from "../misc"
import { LoadingButton } from "@mui/lab"
import Feedback from "../scaffold/Feedback"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { gql, useMutation } from "@apollo/client"

const REQUEST_RECOVERY = gql`mutation RequestAccountRecovery($email: String) {
    requestAccountRecovery(input: {email: $email}) {
      integer
    }
}`

interface Props {
    onCancel: () => void
}

const TriggerPasswordRecovery = (p: Props) => {
    const uiContext = useContext(UiContext)
    const [recoveryStatus, setRecoveryStatus] = useState<DataLoadState<boolean>>(initial(false,false))
    const [recoverAccount] = useMutation(REQUEST_RECOVERY)

    return <Formik initialValues={{ email: '' }}
        validationSchema={yup.object().shape({
            email: yup.string().email(uiContext.i18n.translator('mustBeValidEmail')).required(uiContext.i18n.translator('requiredField'))
        })} onSubmit={async values => {
            setRecoveryStatus(initial(true))
            try {
                await recoverAccount({ variables: { email: values.email } } )
                setRecoveryStatus(fromData(true))
            } catch(e) {
                setRecoveryStatus(fromError(e, uiContext.i18n.translator('requestError')))
            }
        }}>
            { ({ handleChange, handleBlur, handleSubmit }) =>
                <Form onSubmit={handleSubmit}>
                    <Stack alignItems="stretch" gap="1rem" >
                        <TextField id="email" name="email" placeholder="Email" onChange={handleChange('email')} onBlur={handleBlur('email')}/>
                        <ErrorMessage component={ErrorText} name="email"/>
                        <Stack>
                            <Stack direction="row" alignSelf="flex-end">
                                <Button color="secondary" onClick={() => p.onCancel()}>{uiContext.i18n.translator('cancelButton')}</Button>
                                <LoadingButton loading={recoveryStatus.loading} type="submit">{uiContext.i18n.translator('recoverButton')}</LoadingButton>
                            </Stack>
                        </Stack>
                        <Feedback visible={!!recoveryStatus.error} onClose={() => {
                            setRecoveryStatus(initial(false, false))
                        }} detail={recoveryStatus.error?.detail} message={recoveryStatus.error?.message} severity="error" />
                        { recoveryStatus.data && <Alert severity="success">{uiContext.i18n.translator('followInstructionsInRecoveryMail')}</Alert> }
                    </Stack>
                </Form>
            }
    </Formik>
}

export default TriggerPasswordRecovery