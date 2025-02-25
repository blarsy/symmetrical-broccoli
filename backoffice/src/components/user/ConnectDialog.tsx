import { Alert, Button, Dialog, DialogContent, DialogTitle, Stack, TextField } from "@mui/material"
import { useContext, useState } from "react"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../scaffold/AppContextProvider"
import { ErrorMessage, Form, Formik } from "formik"
import * as yup from 'yup'
import useAccountFunctions from "@/lib/useAccountFunctions"
import { LoadingButton } from "@mui/lab"
import { ErrorText } from "../misc"
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from "jwt-decode"
import config from "@/config"

interface Props {
    visible: boolean
    onClose: () => void
    version: string
}

const ConnectDialog = (p: Props) => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const { connectWithGoogle, login } = useAccountFunctions(p.version)
    const [connectionStatus, setConnectionStatus] = useState<{ loading: boolean, error?: Error  }>({ loading: false })
    const t = appContext.i18n.translator

    return <Dialog open={p.visible}>
        <DialogTitle>{t('connectDialogTitle')}</DialogTitle>
        <DialogContent>
            <Formik initialValues={{ email: '', password: '' }}
                validationSchema={yup.object().shape({
                    email: yup.string().email(t('mustBeValidEmail')).required(t('requiredField')),
                    password: yup.string().required(t('requiredField'))
                })} onSubmit={async values => {
                    setConnectionStatus({ loading: true })
                    try {
                        await login(values.email, values.password)
                        setConnectionStatus({ loading: false })
                        p.onClose()
                    } catch(e) {
                        setConnectionStatus({ loading: false, error: e as Error})
                    }
                }}>
                    { ({ handleChange, handleBlur, handleSubmit }) =>
                        <Form onSubmit={handleSubmit}>
                            <Stack>
                                <GoogleLogin onSuccess={async c => {
                                    setConnectionStatus({ loading: true })
                                    try {
                                        await connectWithGoogle(c.credential!, (name, email, gauthToken) => {
    
                                        })
                                        setConnectionStatus({ loading: false })
                                        p.onClose()
                                    } catch(e) {
                                        setConnectionStatus({ loading: false, error: e as Error })
                                    }
                                }}/>
                                <TextField id="email" name="email" placeholder="Email" onChange={handleChange('email')} onBlur={handleBlur('email')}/>
                                <ErrorMessage component={ErrorText} name="email"/>
                                <TextField id="password" name="password" placeholder={t('passwordLabel')} onChange={handleChange('password')} onBlur={handleBlur('password')}/>
                                <ErrorMessage component={ErrorText} name="password" />
                                <Stack direction="row">
                                    <Button color="secondary" onClick={() => p.onClose()}>{t('cancelButton')}</Button>
                                    <LoadingButton loading={connectionStatus.loading} type="submit">{t('connectButton')}</LoadingButton>
                                </Stack>
                                { connectionStatus.error && <Alert onClose={() => {
                                    setConnectionStatus({ loading: false })
                                }} severity="error">{connectionStatus.error.message}</Alert>  }
                            </Stack>
                        </Form>
                    }
            </Formik>
        </DialogContent>
    </Dialog>
}

export default ConnectDialog