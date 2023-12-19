import { Formik, ErrorMessage } from "formik"
import { t } from "i18next"
import { View } from "react-native"
import { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import { login } from "@/lib/api"
import React, { useContext, useState } from "react"
import * as yup from "yup"
import { AppContext } from "@/components/AppContextProvider"
import { Button, Portal, Snackbar } from "react-native-paper"
import Icons from "@expo/vector-icons/FontAwesome"
import { OrangeBackedErrorText, OrangeTextInput, StyledLabel, WhiteButton } from "@/components/layout/lib"
import { aboveMdWidth } from "@/lib/utils"

interface Props {
    toggleRegistering: () => void,
    toggleRecovering: () => void
}

const LoginForm = ({ toggleRegistering, toggleRecovering }: Props) => {
    const appContext = useContext(AppContext)
    const [loginState, setLoginstate] = useState(initial<null>(false, null))

    return <Formik initialValues={{ email: '', password: '' }} validationSchema={yup.object().shape({
        email: yup.string().email(t('invalid_email')).required(t('field_required')),
        password: yup.string().required(t('field_required'))
    })} onSubmit={async (values) => {
        setLoginstate(beginOperation())
        try {
            const res = await login(values.email.trim(), values.password)
            const data = await res.json()
            appContext.actions.loginComplete(data.token, data.account)
            setLoginstate(fromData(null))
        } catch(e: any) {
            setLoginstate(fromError(e, t('connection_error')))
            appContext.actions.setMessage(e)
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
                loading={loginState.loading}>
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
                <Snackbar role="alert" visible={!!loginState.error && !!loginState.error.message} onDismiss={() => setLoginstate(initial<null>(false, null))}>
                    {loginState.error && loginState.error.message}
                </Snackbar>
            </Portal>
        </View>)}
    </Formik>
}

export default LoginForm