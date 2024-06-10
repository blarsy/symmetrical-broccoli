import { Formik, ErrorMessage } from "formik"
import i18n, { t } from "i18next"
import React from "react"
import * as yup from 'yup'
import { View } from "react-native"
import { OrangeBackedErrorText, OrangeTextInput, StyledLabel, WhiteButton } from "@/components/layout/lib"
import { gql, useMutation } from "@apollo/client"
import { isValidPassword, } from "@/lib/utils"
import OperationFeedback from "../OperationFeedback"
import { AccountInfo } from "@/lib/schema"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"

interface Props {
    toggleRegistering: () => void
    onAccountRegistered?: (token: string, account: AccountInfo) => void
}

const REGISTER_ACCOUNT = gql`mutation RegisterAccount($email: String, $name: String, $password: String, $language: String) {
    registerAccount(input: {email: $email, name: $name, password: $password, language: $language}) {
      jwtToken
    }
  }`

const RegisterForm = ({ toggleRegistering, onAccountRegistered }: Props) => {
    const { login } = useUserConnectionFunctions()
    const [registerAccount, { data, loading, error, reset }] = useMutation(REGISTER_ACCOUNT)
    return <Formik initialValues={{ email: '', password: '', repeatPassword: '', name: '' }} validationSchema={yup.object().shape({
        name: yup.string().required(t('field_required')),
        email: yup.string().email(t('invalid_email')).required(t('field_required')),
        password: yup.string().required(t('field_required')).test({ 
            name: 'passwordValid', 
            message: t('password_invalid'), 
            test: isValidPassword
        }),
        repeatPassword: yup.string().required(t('field_required')).test('passwordsIdentical', t('passwords_dont_match'), (val, ctx) => val === ctx.parent.password )
    })} onSubmit={async (values) => {
        const res = await registerAccount({ variables: { email: values.email,
            name: values.name, 
            password: values.password,
            language: i18n.language.substring(0, 2).toLowerCase() } })
        if(res.data) {
            const account = await login(res.data.registerAccount.jwtToken)
            onAccountRegistered && onAccountRegistered(res.data.registerAccount.jwtToken, account)
        }
    }}>
    {({ handleChange, handleBlur, handleSubmit, values }) => (
        <View>
            <OrangeTextInput label={<StyledLabel label={t('organization_name_label')} />} textContentType="givenName" value={values.name}
                onChangeText={handleChange('name')} onBlur={handleBlur('name')} />
            <ErrorMessage component={OrangeBackedErrorText} name="name" />
            <OrangeTextInput label={<StyledLabel label={t('email_label')} />} textContentType="emailAddress" value={values.email}
                onChangeText={handleChange('email')} onBlur={handleBlur('email')} />
            <ErrorMessage component={OrangeBackedErrorText} name="email" />
            <OrangeTextInput label={<StyledLabel label={t('password_label')} />} textContentType="password" secureTextEntry value={values.password}
                onChangeText={handleChange('password')} onBlur={handleBlur('password')} />
            <ErrorMessage component={OrangeBackedErrorText} name="password" />
            <OrangeTextInput label={<StyledLabel label={t('repeatpassword_label')} />} textContentType="password" secureTextEntry value={values.repeatPassword}
                onChangeText={handleChange('repeatPassword')} onBlur={handleBlur('repeatPassword')} />
            <ErrorMessage component={OrangeBackedErrorText} name="repeatPassword" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <WhiteButton style={{ flex: 1 }} onPress={e => { handleSubmit() }} loading={loading}>
                    {t('ok_caption')}
                </WhiteButton>
                <OperationFeedback error={error} onDismissError={reset}/>
                <WhiteButton style={{ flex: 1 }} onPress={() => {
                    toggleRegistering()
                }}>
                    {t('cancel_caption')}
                </WhiteButton>
            </View>
        </View>)}
    </Formik>
}

export default RegisterForm