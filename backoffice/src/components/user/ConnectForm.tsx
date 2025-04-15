import { LoadingButton } from "@mui/lab"
import { TextField, Button, Alert } from "@mui/material"
import { Stack } from "@mui/system"
import { Formik, Form, ErrorMessage } from "formik"
import * as yup from "yup"
import { ErrorText } from "../misc"
import { useContext, useState } from "react"
import useAccountFunctions from "@/lib/useAccountFunctions"
import { AppContext } from "../scaffold/AppContextProvider"
import { useGoogleLogin } from '@react-oauth/google'
import GoogleLogo from '../../../public/google.svg'
import Feedback from "../scaffold/Feedback"

interface Props {
    onClose: () => void
    version: string
}

const ConnectForm = (p: Props) => {
    const appContext = useContext(AppContext)
    const { connectGoogleWithAccessCode, login, registerViaGoogle } = useAccountFunctions(p.version)
    const [connectionStatus, setConnectionStatus] = useState<{ loading: boolean, error?: Error  }>({ loading: false })
    const t = appContext.i18n.translator

    const triggerLogin = useGoogleLogin({
        onSuccess: async res => {
            setConnectionStatus({ loading: true })
            try {
                await connectGoogleWithAccessCode(res.code, async (name, email, token) => {
                    return registerViaGoogle(name, email, appContext.i18n.lang, token)
                })
                setConnectionStatus({ loading: false })
                p.onClose()
            } catch(e) {
                setConnectionStatus({ loading: false, error: e as Error })
            }
        }, flow: 'auth-code', select_account: true
      })
    
    return <Formik initialValues={{ email: '', password: '' }}
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
                    <Stack alignItems="stretch" gap="1rem" sx={{ colorScheme: appContext.lightMode ? 'light': 'dark' }}>
                        <Button color="primary" sx={{ alignSelf: 'center' }} startIcon={<GoogleLogo width={'1.5rem'} height={'1.5rem'} />}
                            onClick={triggerLogin}>{appContext.i18n.translator('conectWithGoogleButtonCaption')}</Button>
                        <TextField id="email" name="email" placeholder="Email" onChange={handleChange('email')} onBlur={handleBlur('email')}/>
                        <ErrorMessage component={ErrorText} name="email"/>
                        <TextField id="password" name="password" placeholder={t('passwordLabel')} onChange={handleChange('password')} onBlur={handleBlur('password')}/>
                        <ErrorMessage component={ErrorText} name="password" />
                        <Stack direction="row" alignSelf="flex-end">
                            <Button color="secondary" onClick={() => p.onClose()}>{t('cancelButton')}</Button>
                            <LoadingButton loading={connectionStatus.loading} type="submit">{t('connectButton')}</LoadingButton>
                        </Stack>
                        <Feedback visible={!!connectionStatus.error} onClose={() => {
                            setConnectionStatus({ loading: false })
                        }} detail={connectionStatus.error?.message} severity="error" />
                    </Stack>
                </Form>
            }
    </Formik>
}

export default ConnectForm