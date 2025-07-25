import { Formik, ErrorMessage } from "formik"
import i18n, { t } from "i18next"
import React, { useState } from "react"
import * as yup from 'yup'
import { View } from "react-native"
import { OrangeBackedErrorText, OrangeTextInput, StyledLabel, WhiteButton } from "@/components/layout/lib"
import { gql, useMutation } from "@apollo/client"
import OperationFeedback from "../OperationFeedback"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import { AuthProviders } from "@/lib/utils"

interface Props {
    toggleRegisteringExternalAuth: () => void
    onAccountRegistered?: () => void
    email: string
    token: string
    suggestedName?: string
    authProvider: AuthProviders
}

const REGISTER_ACCOUNT_EXTERNAL_AUTH = gql`mutation RegisterAccountExternalAuth($accountName: String, $email: String, $language: String, $token: String, $authProvider: Int) {
  registerAccountExternalAuth(
    input: {accountName: $accountName, email: $email, language: $language, token: $token, authProvider: $authProvider}
  ) {
    jwtToken
  }
}`

const RegisterExternalAuthForm = ({ toggleRegisteringExternalAuth, onAccountRegistered, email, token, suggestedName, authProvider }: Props) => {
    const { login } = useUserConnectionFunctions()
    const [error, setError] = useState<Error | undefined>(undefined)
    const [registerAccount, { loading, reset }] = useMutation(REGISTER_ACCOUNT_EXTERNAL_AUTH)
    return <Formik initialValues={{ email: '', password: '', repeatPassword: '', name: suggestedName  }} validationSchema={yup.object().shape({
        name: yup.string().required(t('field_required')).max(30, t('name_too_long')),
    })} onSubmit={async (values) => {
        try {
            const res = await registerAccount({ variables: { email: email,
                accountName: values.name, 
                language: i18n.language.substring(0, 2).toLowerCase(),
                token,
                authProvider } })
            if(res.data) {
                if(!res.data.registerAccountExternalAuth.jwtToken) {
                    throw new Error('Registration error: JWT token returned is null.')
                } else {
                    await login(res.data.registerAccountExternalAuth.jwtToken)
                    onAccountRegistered && onAccountRegistered()
                }
            }
        } catch(e) {
            setError(e as Error)
        }
    }}>
    {({ handleChange, handleBlur, handleSubmit, values }) => (
        <View>
            <OrangeTextInput label={<StyledLabel color="#fff" isMandatory label={t('organization_name_label')} />} textContentType="givenName" value={values.name}
                onChangeText={handleChange('name')} onBlur={handleBlur('name')} />
            <ErrorMessage component={OrangeBackedErrorText} name="name" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <WhiteButton style={{ flex: 1 }} onPress={e => { handleSubmit() }} loading={loading}>
                    {t('ok_caption')}
                </WhiteButton>
                <OperationFeedback testID="registerExternalAuthFeedback" error={error} onDismissError={reset}/>
                <WhiteButton style={{ flex: 1 }} onPress={() => {
                    toggleRegisteringExternalAuth()
                }}>
                    {t('cancel_caption')}
                </WhiteButton>
            </View>
        </View>)}
    </Formik>
}

export default RegisterExternalAuthForm