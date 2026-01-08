import { LoadingButton } from "@mui/lab"
import { Button, TextField, Stack } from "@mui/material"
import { Formik, Form, ErrorMessage } from "formik"
import * as yup from 'yup'
import { ErrorText } from "../misc"
import Feedback from "../scaffold/Feedback"
import { useContext, useState } from "react"
import { isValidPassword } from "@/utils"
import GoogleLogo from '../../app/img/google-logo.svg?react'
import AppleLogo from '../../app/img/apple-logo.svg?react'
import { AuthProviders } from "@/lib/utils"
import { useGoogleLogin } from "@react-oauth/google"
import { v4 as uuid } from 'uuid'
import { appleAuthHelpers } from "react-apple-signin-auth"
import { getCommonConfig } from "@/config"
import { fromError } from "@/lib/DataLoadState"
import useAccountFunctions from "@/lib/useAccountFunctions"
import { UiContext } from "../scaffold/UiContextProvider"

interface Props {
    onClose: () => void
    onRegisterExternalAuthProviderRequested: (suggestedName: string, email: string, token: string, provider: AuthProviders) => void
    version: string
}

const RegisterForm = (p: Props) => {
    const uiContext = useContext(UiContext)
    const [registrationStatus, setRegistrationStatus] = useState<{ loading: boolean, error?: Error  }>({ loading: false })
    const t = uiContext.i18n.translator
    const { appleServiceId, appleAuthRedirectUri } = getCommonConfig()
    const { connectGoogleWithAccessCode, connectApple, registerAccount } = useAccountFunctions(p.version)

    const triggerGoogleLogin = useGoogleLogin({
        onSuccess: async res => {
            setRegistrationStatus({ loading: true })
            try {
                const done = await connectGoogleWithAccessCode(res.code, async (name, email, token) => {
                    p.onRegisterExternalAuthProviderRequested(name, email, token, AuthProviders.google)
                })
                setRegistrationStatus({ loading: false })
                if(done) p.onClose()
            } catch(e) {
                setRegistrationStatus({ loading: false, error: e as Error })
            }
        }, flow: 'auth-code', select_account: true
    })

    const triggerAppleLogin = () => {
        const rawNonce = uuid()
        const state = uuid()
        setRegistrationStatus({ loading: true })
        appleAuthHelpers.signIn({
            authOptions: { 
                clientId: appleServiceId,
                scope: 'email name',
                redirectURI: appleAuthRedirectUri,
                state,
                nonce: rawNonce,
                usePopup: true
            },
            onSuccess: (res: any) => {
                connectApple(res.authorization.id_token, rawNonce, res.user?.firstName, res.user?.lastName, async (name, email, token) => {
                    p.onRegisterExternalAuthProviderRequested(name, email, token, AuthProviders.apple)
                    return
                })
                setRegistrationStatus({ loading: false })
                p.onClose()
            },
            onError: (e: any) => {
                setRegistrationStatus(fromError(e as Error, uiContext.i18n.translator('requestError')))
            }
        })
    }
    
    return <Formik initialValues={{ email: '', password: '', repeatPassword: '', name: '' }}
        validationSchema={yup.object().shape({
            email: yup.string().email(t('mustBeValidEmail')).required(t('requiredField')),
            name: yup.string().required(t('requiredField')).max(30, t('nameTooLong')),
            password: yup.string().required(t('requiredField')).test({ 
                name: 'passwordValid', 
                message: t('passwordInvalid'),
                test: isValidPassword
            }),
            repeatPassword: yup.string().required(t('requiredField')).test('passwordsIdentical', t('passwordsDontMatch'), (val, ctx) => val === ctx.parent.password )
        })} onSubmit={async values => {
            setRegistrationStatus({ loading: true })
            try {
                await registerAccount(values.email, values.password, values.name, uiContext.i18n.lang.toLowerCase())
                setRegistrationStatus({ loading: false })
                p.onClose()
            } catch(e) {
                setRegistrationStatus({ loading: false, error: e as Error})
            }
        }}>
            { ({ handleChange, handleBlur, handleSubmit }) =>
                <Form onSubmit={handleSubmit}>
                    <Stack alignItems="stretch" gap="1rem" sx={{ colorScheme: uiContext.lightMode ? 'light': 'dark' }}>
                        <Button color="primary" sx={{ alignSelf: 'center' }} startIcon={<GoogleLogo width={'1.5rem'} height={'1.5rem'} />}
                            onClick={triggerGoogleLogin}>{uiContext.i18n.translator('conectWithGoogleButtonCaption')}</Button>
                        <Button color="primary" sx={{ alignSelf: 'center' }} startIcon={<AppleLogo width={'1.5rem'} height={'1.5rem'} />}
                            onClick={triggerAppleLogin}>{uiContext.i18n.translator('conectWithAppleButtonCaption')}</Button>
                        <TextField id="name" name="name" label={t('accountNameLabel')} onChange={handleChange('name')} onBlur={handleBlur('name')}/>
                        <ErrorMessage component={ErrorText} name="name"/>
                        <TextField id="email" name="email" label="Email" onChange={handleChange('email')} onBlur={handleBlur('email')}/>
                        <ErrorMessage component={ErrorText} name="email"/>
                        <TextField id="password" type="password" name="password" label={t('passwordLabel')} onChange={handleChange('password')} onBlur={handleBlur('password')}/>
                        <ErrorMessage component={ErrorText} name="password" />
                        <TextField id="repeatPassword" type="password" name="repeatPassword" label={t('repeatPasswordLabel')} onChange={handleChange('repeatPassword')} onBlur={handleBlur('repeatPassword')}/>
                        <ErrorMessage component={ErrorText} name="repeatPassword" />
                        <Stack>
                            <Stack direction="row" alignSelf="flex-end">
                                <Button color="secondary" onClick={() => p.onClose()}>{t('cancelButton')}</Button>
                                <LoadingButton loading={registrationStatus.loading} type="submit">{t('registerButton')}</LoadingButton>
                            </Stack>
                        </Stack>
                        <Feedback visible={!!registrationStatus.error} onClose={() => {
                            setRegistrationStatus({ loading: false })
                        }} detail={registrationStatus.error?.message} severity="error" />
                    </Stack>
                </Form>
            }
    </Formik>
}

export default RegisterForm

