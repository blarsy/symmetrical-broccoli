import { ErrorMessage } from "formik"
import i18n, { t } from "i18next"
import React from "react"
import * as yup from 'yup'
import { View } from "react-native"
import { OrangeBackedErrorText, OrangeTextInput, StyledLabel, WhiteButton } from "@/components/layout/lib"
import { isValidPassword } from "@/lib/utils"
import OperationFeedback from "../OperationFeedback"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import GoogleSignin from "./GoogleSignin"
import KeyboardAvoidingForm from "./KeyboardAvoidingForm"
import { useMutation } from "@apollo/client"
import { GraphQlLib } from "@/lib/backendFacade"

interface Props {
    toggleRegistering: () => void
    onAccountRegistered?: () => void
    onAccountRegistrationRequired: (email: string, token: string) => void
}

const RegisterForm = ({ toggleRegistering, onAccountRegistered, onAccountRegistrationRequired }: Props) => {
    const { login } = useUserConnectionFunctions()
    const [registerAccount, { loading, error, reset }] = useMutation(GraphQlLib.mutations.REGISTER_ACCOUNT)
    return <>
        <GoogleSignin onAccountRegistrationRequired={onAccountRegistrationRequired} onDone={async jwtToken => {
            await login(jwtToken)
            onAccountRegistered && onAccountRegistered()
        }} />
            <KeyboardAvoidingForm initialValues={{ email: '', password: '', repeatPassword: '', name: '' }} validationSchema={yup.object().shape({
                name: yup.string().required(t('field_required')).max(30, t('name_too_long')),
                email: yup.string().email(t('invalid_email')).required(t('field_required')),
                password: yup.string().required(t('field_required')).test({ 
                    name: 'passwordValid', 
                    message: t('password_invalid'),
                    test: isValidPassword
                }),
                repeatPassword: yup.string().required(t('field_required')).test('passwordsIdentical', t('passwords_dont_match'), (val, ctx) => val === ctx.parent.password )
            })} onSubmit={async (values) => {
                const res = await registerAccount({ variables: { name: values.name, email: values.email, 
                    password: values.password, language: i18n.language.substring(0, 2).toLowerCase() }})
                if(res.data) {
                    await login(res.data.registerAccount.jwtToken)
                    onAccountRegistered && onAccountRegistered()
                }
            }}>
            {({ handleChange, handleBlur, handleSubmit, values }) => (
                <View style={{ gap: 10 }}>
                    <OrangeTextInput testID="name" label={<StyledLabel color="#fff"  isMandatory label={t('organization_name_label')} />} textContentType="givenName" value={values.name}
                        onChangeText={handleChange('name')} onBlur={handleBlur('name')} />
                    <ErrorMessage component={OrangeBackedErrorText} name="name" />
                    <OrangeTextInput testID="email" label={<StyledLabel color="#fff" isMandatory label={t('email_label')} />} textContentType="emailAddress" value={values.email}
                        onChangeText={newText => handleChange('email')(newText.trim())} onBlur={handleBlur('email')} />
                    <ErrorMessage component={OrangeBackedErrorText} name="email" />
                    <OrangeTextInput testID="password" label={<StyledLabel color="#fff" isMandatory label={t('password_label')} />} textContentType="password" secureTextEntry value={values.password}
                        onChangeText={handleChange('password')} onBlur={handleBlur('password')} />
                    <ErrorMessage component={OrangeBackedErrorText} name="password" />
                    <OrangeTextInput testID="repeatPassword" label={<StyledLabel color="#fff" isMandatory label={t('repeatpassword_label')} />} textContentType="password" secureTextEntry value={values.repeatPassword}
                        onChangeText={handleChange('repeatPassword')} onBlur={handleBlur('repeatPassword')} />
                    <ErrorMessage component={OrangeBackedErrorText} name="repeatPassword" />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                        <WhiteButton testID="ok" style={{ flex: 1 }} onPress={e => { handleSubmit() }} loading={loading}>
                            {t('ok_caption')}
                        </WhiteButton>
                        <OperationFeedback testID="registerFeedback" error={error} onDismissError={reset}/>
                        <WhiteButton testID="cancel" style={{ flex: 1 }} onPress={() => {
                            toggleRegistering()
                        }}>
                            {t('cancel_caption')}
                        </WhiteButton>
                    </View>
                </View>)}
            </KeyboardAvoidingForm>
    </>
}

export default RegisterForm