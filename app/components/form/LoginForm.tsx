import { Formik, ErrorMessage } from "formik"
import { t } from "i18next"
import { View } from "react-native"
import React, { useState } from "react"
import * as yup from "yup"
import { Button, Portal } from "react-native-paper"
import Icons from "@expo/vector-icons/FontAwesome"
import { OrangeBackedErrorText, OrangeTextInput, StyledLabel, WhiteButton } from "@/components/layout/lib"
import { aboveMdWidth } from "@/lib/utils"
import { gql, useMutation } from "@apollo/client"
import { ErrorSnackbar } from "../OperationFeedback"
import { AccountInfo } from "@/lib/schema"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"

interface Props {
    toggleRegistering: () => void,
    toggleRecovering: () => void,
    onDone?: (token: string, account: AccountInfo) => void
}

const GET_JWT = gql`mutation Authenticate($email: String, $password: String) {
    authenticate(input: {email: $email, password: $password}) {
        jwtToken
    }
}`

const LoginForm = ({ toggleRegistering, toggleRecovering, onDone }: Props) => {
    const [authenticate, {loading}] = useMutation(GET_JWT)
    const [authError, setAuthError] = useState(undefined as Error|undefined)
    const { loginComplete } = useUserConnectionFunctions()

    return <Formik initialValues={{ email: '', password: '' }} validationSchema={yup.object().shape({
        email: yup.string().email(t('invalid_email')).required(t('field_required')),
        password: yup.string().required(t('field_required'))
    })} onSubmit={async (values) => {
        try {
            const res = await authenticate({variables: { email: values.email, password: values.password }})
            if(res.data && res.data.authenticate.jwtToken) {
                const account = await loginComplete(res.data.authenticate.jwtToken)
                onDone && onDone(res.data.authenticate.jwtToken, account)
            } else {
                setAuthError(new Error('Authentication failed'))
            }
        }catch(e) {
            setAuthError(e as Error)
        }
    }}>
    {({ handleChange, handleBlur, handleSubmit, values }) => (<View>
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
                <ErrorSnackbar error={authError} message={authError ? t('authentication_failed') : undefined} onDismissError={() => setAuthError(undefined)} />
            </Portal>
        </View>)}
    </Formik>
}

export default LoginForm