import { AuthProviders } from "@/lib/utils"
import { ErrorMessage, Form, Formik } from "formik"
import { useContext, useState } from "react"
import * as yup from 'yup'
import { AppContext } from "../scaffold/AppContextProvider"
import { gql, useMutation } from "@apollo/client"
import { Button, Stack, TextField } from "@mui/material"
import { LoadingButton } from "@mui/lab"
import Feedback from "../scaffold/Feedback"
import { ErrorText } from "../misc"
import useAccountFunctions from "@/lib/useAccountFunctions"

interface Props {
    suggestedName: string
    email: string
    token: string
    provider: AuthProviders
    onClose: () => void
    version: string
}

const REGISTER_ACCOUNT_EXTERNAL_AUTH = gql`mutation RegisterAccountExternalAuth($accountName: String, $email: String, $language: String, $token: String, $authProvider: Int) {
  registerAccountExternalAuth(
    input: {accountName: $accountName, email: $email, language: $language, token: $token, authProvider: $authProvider}
  ) {
    jwtToken
  }
}`

const RegisterExternalAuthForm = (p: Props) => {
    const appContext = useContext(AppContext)
    const t = appContext.i18n.translator
    const [registrationStatus, setRegistrationStatus] = useState<{ loading: boolean, error?: Error  }>({ loading: false })
    const [registerAccount, { loading }] = useMutation(REGISTER_ACCOUNT_EXTERNAL_AUTH)
    const { completeExternalAuth } = useAccountFunctions(p.version)
    
    return <Formik initialValues={{ name: '' }}
        validationSchema={yup.object().shape({
            name: yup.string().required(t('requiredField')).max(30, t('nameTooLong'))
        })} onSubmit={async values => {
            setRegistrationStatus({ loading: true })
            try {
                const res = await registerAccount({ variables: { accountName: values.name, email: p.email, 
                    language: appContext.i18n.lang.toLowerCase(), token: p.token, authProvider: p.provider } } )
                setRegistrationStatus({ loading: false })
                if(res.data) {
                    if(!res.data.registerAccountExternalAuth.jwtToken) {
                        throw new Error('Registration error: JWT token returned is null.')
                    } else {
                        await completeExternalAuth(p.email, p.token, p.provider)
                    }
                }
            } catch(e) {
                setRegistrationStatus({ loading: false, error: e as Error})
            }
        }}>
            { ({ handleChange, handleBlur, handleSubmit }) =>
                <Form onSubmit={handleSubmit}>
                    <Stack alignItems="stretch" gap="1rem" sx={{ colorScheme: appContext.lightMode ? 'light': 'dark' }}>
                        <TextField id="name" name="name" onChange={handleChange('name')} onBlur={handleBlur('name')} placeholder={appContext.i18n.translator('accountNameLabel')}/>
                        <ErrorMessage component={ErrorText} name="name"/>
                        <Stack>
                            <Stack direction="row" alignSelf="flex-end">
                                <Button color="secondary" onClick={() => p.onClose()}>{t('cancelButton')}</Button>
                                <LoadingButton loading={registrationStatus.loading || loading} type="submit">{t('registerButton')}</LoadingButton>
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

export default RegisterExternalAuthForm