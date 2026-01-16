import { LoadingButton } from "@mui/lab"
import { TextField, Button, Alert, Link } from "@mui/material"
import { Stack } from "@mui/system"
import { Formik, Form, ErrorMessage } from "formik"
import * as yup from "yup"
import { ErrorText } from "../misc"
import { useContext, useState } from "react"
import useAccountFunctions from "@/lib/useAccountFunctions"
import { useGoogleLogin } from '@react-oauth/google'
import GoogleLogo from '../../app/img/google-logo.svg?react'
import AppleLogo from '../../app/img/apple-logo.svg?react'
import Feedback from "../scaffold/Feedback"
import { appleAuthHelpers } from 'react-apple-signin-auth'
import { v4 as uuid } from 'uuid'
import { getCommonConfig } from "@/config"
import { fromError } from "@/lib/DataLoadState"
import { AuthProviders } from "@/lib/utils"
import { UiContext } from "../scaffold/UiContextProvider"

interface Props {
    onClose?: () => void
    version: string
    onRegisterRequested: () => void
    onPasswordRecoveryRequested: () => void
    onRegisterExternalAuthProviderRequested: (suggestedName: string, email: string, token: string, provider: AuthProviders) => void
}


const ConnectForm = (p: Props) => {
    const uiContext = useContext(UiContext)
    const { connectGoogleWithAccessCode, login, connectApple } = useAccountFunctions(p.version)
    const [connectionStatus, setConnectionStatus] = useState<{ loading: boolean, error?: Error  }>({ loading: false })
    const t = uiContext.i18n.translator
    const { appleServiceId, appleAuthRedirectUri } = getCommonConfig()

    const triggerGoogleLogin = useGoogleLogin({
        onSuccess: async res => {
            setConnectionStatus({ loading: true })
            try {
                const done = await connectGoogleWithAccessCode(res.code, async (name, email, token) => {
                    p.onRegisterExternalAuthProviderRequested(name, email, token, AuthProviders.google)
                })
                setConnectionStatus({ loading: false })
                if(done) p.onClose && p.onClose()
            } catch(e) {
                setConnectionStatus({ loading: false, error: e as Error })
            }
        }, flow: 'auth-code', select_account: true
    })

    const triggerAppleLogin = () => {
        const rawNonce = uuid()
        const state = uuid()
        setConnectionStatus({ loading: true })
        appleAuthHelpers.signIn({
            authOptions: { 
                clientId: appleServiceId,
                /** Requested scopes, seperated by spaces - eg: 'email name' */
                scope: 'email name',
                /** Apple's redirectURI - must be one of the URIs you added to the serviceID - the undocumented trick in apple docs is that you should call auth from a page that is listed as a redirectURI, localhost fails */
                redirectURI: appleAuthRedirectUri,
                /** State string that is returned with the apple response */
                state,
                /** Nonce */
                nonce: rawNonce,
                usePopup: true
            },
            onSuccess: async (res: any) => {
                const done = await connectApple(res.authorization.id_token, rawNonce, res.user?.firstName, res.user?.lastName, async (name, email, token) => {
                    p.onRegisterExternalAuthProviderRequested(name, email, token, AuthProviders.apple)
                })
                setConnectionStatus({ loading: false })
                if(done) p.onClose && p.onClose()
            },
            onError: (e: any) => {
                setConnectionStatus(fromError(e as Error, uiContext.i18n.translator('requestError')))
            }
        })
    }
    
    return <Formik initialValues={{ email: '', password: '' }}
        validationSchema={yup.object().shape({
            email: yup.string().email(t('mustBeValidEmail')).required(t('requiredField')),
            password: yup.string().required(t('requiredField'))
        })} onSubmit={async values => {
            setConnectionStatus({ loading: true })
            try {
                await login(values.email, values.password)
                setConnectionStatus({ loading: false })
                p.onClose && p.onClose()
            } catch(e) {
                setConnectionStatus({ loading: false, error: e as Error})
            }
        }}>
            { ({ handleChange, handleBlur, handleSubmit }) =>
                <Form onSubmit={handleSubmit}>
                    <Stack alignItems="stretch" gap="1rem" sx={{ colorScheme: uiContext.lightMode ? 'light': 'dark' }}>
                        <Button color="primary" sx={{ alignSelf: 'center' }} startIcon={<GoogleLogo width={'1.5rem'} height={'1.5rem'} />}
                            onClick={triggerGoogleLogin}>{uiContext.i18n.translator('conectWithGoogleButtonCaption')}</Button>
                        <Button color="primary" sx={{ alignSelf: 'center' }} startIcon={<AppleLogo width={'1.5rem'} height={'1.5rem'} />}
                            onClick={triggerAppleLogin}>{uiContext.i18n.translator('conectWithAppleButtonCaption')}</Button>
                        <TextField id="email" name="email" label="Email" onChange={handleChange('email')} onBlur={handleBlur('email')}/>
                        <ErrorMessage component={ErrorText} name="email"/>
                        <TextField type="password" id="password" name="password" label={t('passwordLabel')} onChange={handleChange('password')} onBlur={handleBlur('password')}/>
                        <ErrorMessage component={ErrorText} name="password" />
                        <Stack>
                            <Stack direction="row" alignSelf="flex-end">
                                { p.onClose && <Button color="secondary" onClick={() => p.onClose!()}>{t('cancelButton')}</Button> }
                                <LoadingButton loading={connectionStatus.loading} type="submit">{t('connectButton')}</LoadingButton>
                            </Stack>
                            <Link component="button" onClick={() => {
                                p.onRegisterRequested()
                            }}>{uiContext.i18n.translator('noAccountYetButtonLink')}</Link>
                            <Link component="button" onClick={() => {
                                p.onPasswordRecoveryRequested()
                            }}>{uiContext.i18n.translator('forgotPasswordButtonLink')}</Link>
                        </Stack>
                        <Feedback testID="ConnectFormFeedback" visible={!!connectionStatus.error} onClose={() => {
                            setConnectionStatus({ loading: false })
                        }} detail={connectionStatus.error?.message} severity="error" />
                    </Stack>
                </Form>
            }
    </Formik>
}

export default ConnectForm