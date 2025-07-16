import { useContext, useState } from "react"
import { UiContext } from "../scaffold/UiContextProvider"
import { Button, Dialog, DialogContent, DialogTitle, Stack, TextField } from "@mui/material"
import { gql, useMutation } from "@apollo/client"
import { ConfirmDialog, ErrorText } from "../misc"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { LoadingButton } from "@mui/lab"
import Feedback from "../scaffold/Feedback"
import { ErrorMessage, Form, Formik } from "formik"
import * as yup from 'yup'
import { isValidPassword } from "@/utils"

const CHANGE_PASSWORD = gql`mutation ChangePassword($newPassword: String, $oldPassword: String) {
    changePassword(input: {newPassword: $newPassword, oldPassword: $oldPassword}) {
        integer
    }
}`

interface Props {
    visible: boolean
    onClose: (success: boolean) => void
}

const ChangePasswordDialog = (p: Props) => {
    const uiContext = useContext(UiContext)
    const [changePassword] = useMutation(CHANGE_PASSWORD)
    const [confirming, setConfirming] = useState(false)
    const [changeStatus, setChangeStatus] = useState<DataLoadState<undefined>>(initial(false))

    return <>
        <Dialog open={p.visible} onClose={() => p.onClose(false)} maxWidth="md" fullWidth>
            <DialogTitle>{uiContext.i18n.translator('changePasswordDialogTitle')}</DialogTitle>
            <DialogContent sx={{ display: 'flex' }}>
                <Formik initialValues={{ currentPassword: '', newPassword: '', repeatNewPassword: '' }}
                    validationSchema={yup.object().shape({
                        currentPassword: yup.string().required(uiContext.i18n.translator('requiredField')),
                        newPassword: yup.string().required(uiContext.i18n.translator('requiredField')).test({ 
                            name: 'passwordValid', 
                            message: uiContext.i18n.translator('passwordInvalid'),
                            test: isValidPassword
                        }),
                        repeatNewPassword: yup.string().required(uiContext.i18n.translator('requiredField'))
                            .test('passwordsIdentical', uiContext.i18n.translator('passwordsDontMatch'), (val, ctx) => val === ctx.parent.newPassword )
                    })} onSubmit={async values => {
                        setConfirming(true)
                    }}>
                        { ({ handleChange, handleBlur, handleSubmit, values }) =>
                            <Form style={{ display: 'flex', flex: 1 }} onSubmit={handleSubmit}>
                                <Stack alignItems="stretch" gap="1rem" flex="1">
                                    <TextField type="password" id="currentPassword" name="currentPassword" placeholder={uiContext.i18n.translator('currentPasswordLabel')} onChange={handleChange('currentPassword')} onBlur={handleBlur('currentPassword')}/>
                                    <ErrorMessage component={ErrorText} name="currentPassword" />
                                    <TextField type="password" id="newPassword" name="newPassword" placeholder={uiContext.i18n.translator('newPasswordLabel')} onChange={handleChange('newPassword')} onBlur={handleBlur('newPassword')}/>
                                    <ErrorMessage component={ErrorText} name="newPassword" />
                                    <TextField type="password" id="repeatNewPassword" name="repeatNewPassword" placeholder={uiContext.i18n.translator('repeatNewPasswordLabel')} onChange={handleChange('repeatNewPassword')} onBlur={handleBlur('repeatNewPassword')}/>
                                    <ErrorMessage component={ErrorText} name="repeatNewPassword" />
                                    <Stack>
                                        <Stack direction="row" alignSelf="flex-end">
                                            { p.onClose && <Button color="secondary" onClick={() => p.onClose!(false)}>{uiContext.i18n.translator('cancelButton')}</Button> }
                                            <LoadingButton loading={changeStatus.loading} type="submit">{uiContext.i18n.translator('okButton')}</LoadingButton>
                                        </Stack>
                                    </Stack>
                                    <Feedback visible={!!changeStatus.error} onClose={() => {
                                        setChangeStatus(initial(false))
                                    }} detail={changeStatus.error?.message} severity="error" />
                                </Stack>
                                <ConfirmDialog onClose={async response => {
                                    if(response) {
                                        setChangeStatus(initial(true))
                                        setConfirming(false)
                                        try {
                                            await changePassword({ variables: { newPassword: values.newPassword, oldPassword: values.currentPassword }})
                                            setChangeStatus(fromData(undefined))
                                            p.onClose && p.onClose(true)
                                        } catch(e) {
                                            setChangeStatus(fromError(e, uiContext.i18n.translator('requestError')))
                                        }
                                    } else {
                                        setConfirming(false)
                                    }
                                }} title={uiContext.i18n.translator('confirmChangePassword')}
                                visible={confirming} />
                            </Form>
                        }
                </Formik>
            </DialogContent>
        </Dialog>
    </>
}

export default ChangePasswordDialog