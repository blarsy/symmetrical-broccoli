import { Formik, ErrorMessage } from "formik"
import { t } from "i18next"
import { View } from "react-native"
import React, { useContext, useState } from "react"
import * as yup from "yup"
import { AppContext } from "@/components/AppContextProvider"
import { Button, Portal, Snackbar } from "react-native-paper"
import Icons from "@expo/vector-icons/FontAwesome"
import { OrangeBackedErrorText, OrangeTextInput, StyledLabel, WhiteButton } from "@/components/layout/lib"
import { aboveMdWidth } from "@/lib/utils"
import { gql, useMutation } from "@apollo/client"

interface Props {
    toggleRegistering: () => void,
    toggleRecovering: () => void
}

const GET_JWT = gql`mutation Authenticate($email: String, $password: String) {
    authenticate(input: {email: $email, password: $password}) {
        jwtToken
    }
}`

const LoginForm = ({ toggleRegistering, toggleRecovering }: Props) => {
    const appContext = useContext(AppContext)
    const [authenticate, {data, loading, error}] = useMutation(GET_JWT)
    const [authFailed, setAuthFailed] = useState(false)

    return <Formik initialValues={{ email: '', password: '' }} validationSchema={yup.object().shape({
        email: yup.string().email(t('invalid_email')).required(t('field_required')),
        password: yup.string().required(t('field_required'))
    })} onSubmit={async (values) => {
        const res = await authenticate({variables: { email: values.email, password: values.password }})
        if(res.data && res.data.authenticate.jwtToken) {
            appContext.actions.loginComplete(res.data.authenticate.jwtToken)
        } else {
            setAuthFailed(true)
        }
    }}>
    {({ handleChange, handleBlur, handleSubmit, values }) => (
        <View>
            <OrangeTextInput label={<StyledLabel label={t('email_label')} />} textContentType="emailAddress" value={values.email}
                onChangeText={handleChange('email')} onBlur={handleBlur('email')} />
            <ErrorMessage component={OrangeBackedErrorText} name="email" />
            <OrangeTextInput label={<StyledLabel label={t('password_label')} />} textContentType="password" secureTextEntry value={values.password}
                onChangeText={handleChange('password')} onBlur={handleBlur('password')} />
            <ErrorMessage component={OrangeBackedErrorText} name="password" />
            <WhiteButton style={{ marginTop: 20, width: aboveMdWidth() ? '60%' : '80%', alignSelf: 'center' }} icon={props => <Icons {...props} name="sign-in" />} onPress={() => handleSubmit()} 
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
                <Snackbar role="alert" visible={!!error} onDismiss={() => {}}>
                    {error && error.message}
                </Snackbar>
                <Snackbar role="alert" visible={authFailed} onDismiss={() => setAuthFailed(false)}>
                    {t('authentication_failed')}
                </Snackbar>
            </Portal>
        </View>)}
    </Formik>
}

export default LoginForm