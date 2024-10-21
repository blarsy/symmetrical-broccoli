import { Formik, ErrorMessage } from "formik"
import { t } from "i18next"
import { View } from "react-native"
import React, { useState } from "react"
import * as yup from "yup"
import { Button, Portal } from "react-native-paper"
import Icons from "@expo/vector-icons/FontAwesome"
import { OrangeBackedErrorText, OrangeTextInput, StyledLabel, WhiteButton } from "@/components/layout/lib"
import { aboveMdWidth } from "@/lib/utils"
import { ErrorSnackbar } from "../OperationFeedback"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import GoogleSignin from "./GoogleSignin"
import { GraphQlLib, useAuthenticate } from "@/lib/backendFacade"
import KeyboardAvoidingForm from "./KeyboardAvoidingForm"
import { useMutation } from "@apollo/client"

interface Props {
    toggleRegistering: () => void
    toggleRecovering: () => void
    onAccountRegistrationRequired: (email: string, token: string) => void
    onDone?: () => void
}

const LoginForm = ({ toggleRegistering, toggleRecovering, onDone, onAccountRegistrationRequired }: Props) => {
    const [authenticate, {loading}] = useMutation(GraphQlLib.mutations.AUTHENTICATE)
    const [authError, setAuthError] = useState(undefined as Error|undefined)
    const { login } = useUserConnectionFunctions()

    return <View style={{ alignItems: 'stretch' }}>
        <GoogleSignin onAccountRegistrationRequired={onAccountRegistrationRequired} onDone={async jwtToken => {
            await login(jwtToken)
            onDone && onDone()
        }} />
        <KeyboardAvoidingForm initialValues={{ email: '', password: '' }} validationSchema={yup.object().shape({
            email: yup.string().email(t('invalid_email')).required(t('field_required')),
            password: yup.string().required(t('field_required'))
        })} onSubmit={async (values) => {
            try {
                const res = await authenticate({ variables: { email: values.email, password: values.password } } )
                if(res.data && res.data.authenticate.jwtToken) {
                    await login(res.data.authenticate.jwtToken)
                    onDone && onDone()
                } else {
                    setAuthError(new Error('Authentication failed'))
                }
            }catch(e) {
                setAuthError(e as Error)
            }
        }}>
        {({ handleChange, handleBlur, handleSubmit, values }) => (<View>
                <OrangeTextInput testID="email" label={<StyledLabel label={t('email_label')} />} textContentType="emailAddress" value={values.email}
                    onChangeText={handleChange('email')} onBlur={handleBlur('email')} />
                <ErrorMessage component={OrangeBackedErrorText} name="email" />
                <OrangeTextInput testID="password" label={<StyledLabel label={t('password_label')} />} textContentType="password" secureTextEntry value={values.password}
                    onChangeText={handleChange('password')} onBlur={handleBlur('password')} />
                <ErrorMessage component={OrangeBackedErrorText} name="password" />
                <WhiteButton testID="login" style={{ marginTop: 20, width: aboveMdWidth() ? '60%' : '80%', alignSelf: 'center' }} icon={props => <Icons {...props} name="sign-in" />} onPress={() => handleSubmit()} 
                    loading={loading}>
                    {t('connection_label')}
                </WhiteButton>
                <Button mode="text" textColor="#fff" icon={props => <Icons {...props} name="user-plus" />} 
                    onPress={toggleRegistering}>
                    {t('notsubscribedyet_label')}
                </Button>                
                <Button mode="text" textColor="#fff" icon={props => <Icons {...props} name="lock" />} 
                    onPress={toggleRecovering}>
                    {t('forgotPassword_label')}
                </Button>
                <Portal>
                    <ErrorSnackbar testID="authenticationError" error={authError} message={authError ? t('authentication_failed') : undefined} onDismissError={() => setAuthError(undefined)} />
                </Portal>
            </View>)}
        </KeyboardAvoidingForm>
    </View>
}

export default LoginForm