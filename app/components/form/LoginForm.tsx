import { Formik, ErrorMessage } from "formik"
import { t } from "i18next"
import { StyleProp, View, ViewStyle } from "react-native"
import { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import { login } from "@/lib/api"
import { OrangeBackedErrorText } from "./ErrorText"
import React, { useContext, useState } from "react"
import * as yup from "yup"
import { AppContext } from "@/components/AppContextProvider"
import OrangeTextInput from "./OrangeTextInput"
import { Button, Portal, Snackbar } from "react-native-paper"
import Icons from "@expo/vector-icons/FontAwesome"
import { WhiteButton } from "@/components/layout/lib"

interface Props {
    toggleRegistering: () => void,
    style: StyleProp<ViewStyle>
}

const LoginForm = ({ toggleRegistering, style }: Props) => {
    const appContext = useContext(AppContext)
    const [loginState, setLoginstate] = useState(initial<null>(false))

    return <View style={style}>
        <Formik initialValues={{ email: '', password: '' }} validationSchema={yup.object().shape({
            email: yup.string().email(t('invalid_email')).required(t('field_required')),
            password: yup.string().required(t('field_required'))
        })} onSubmit={async (values) => {
            setLoginstate(beginOperation())
            try {
                const res = await login(values.email, values.password)
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
                <OrangeTextInput label={t('email_label')} textContentType="emailAddress" value={values.email}
                    onChangeText={handleChange('email')} onBlur={handleBlur('email')} />
                <ErrorMessage component={OrangeBackedErrorText} name="email" />
                <OrangeTextInput label={t('password_label')} textContentType="password" secureTextEntry value={values.password}
                    onChangeText={handleChange('password')} onBlur={handleBlur('password')} />
                <ErrorMessage component={OrangeBackedErrorText} name="password" />
                <WhiteButton icon={props => <Icons {...props} name="sign-in" />} onPress={() => handleSubmit()} 
                    loading={loginState.loading}>
                    {t('connection_label')}
                </WhiteButton>
                <Button mode="text" textColor="#fff" icon={props => <Icons {...props} name="user-plus" />} 
                    onPress={toggleRegistering} labelStyle={{ fontSize: 16 }}>
                    {t('notsubscribedyet_label')}
                </Button>
                <Portal>
                    <Snackbar role="alert" visible={!!loginState.error && !!loginState.error.message} onDismiss={() => setLoginstate(initial<null>(false))}>
                        {loginState.error && loginState.error.message}
                    </Snackbar>
                </Portal>
            </View>)}
        </Formik>
    </View>
}

export default LoginForm