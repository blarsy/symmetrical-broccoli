import { Button, Snackbar, TextInput, TextInputProps } from "@react-native-material/core"
import { Formik, ErrorMessage } from "formik"
import { t } from "i18next"
import { StyleProp, View, ViewStyle } from "react-native"
import { beginOperation, fromData, fromError, initial } from "../../lib/DataLoadState"
import { login } from "../../lib/api"
import { OrangeBackedErrorText } from "./ErrorText"
import React, { useContext, useState } from "react"
import * as yup from "yup"
import { AppContext } from "../AppContextProvider"
import Icons from "@expo/vector-icons/FontAwesome"
import { primaryColor } from "../layout/constants"

interface Props {
    toggleRegistering: () => void,
    style: StyleProp<ViewStyle>
}

const OrangeTextInput = (props: TextInputProps) => <TextInput variant="standard" color="#fff" inputContainerStyle={{
    backgroundColor: primaryColor,
}} inputStyle={{
    backgroundColor: primaryColor,
    color: '#fff'
}} style={{
    backgroundColor: primaryColor,
    marginTop: 10,
}}  {...props}/>

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
                <Button tintColor="#000" color="#fff" leading={props => <Icons {...props} name="sign-in" />} title={t('connection_label')} variant="contained" onPress={handleSubmit} loading={loginState.loading}/>
                {loginState.error && loginState.error.message && <Snackbar message={loginState.error.message} /> }
                <Button color="#fff" leading={props => <Icons {...props} name="user-plus" />} title={t('notsubscribedyet_label')} variant="text" onPress={() => {
                    toggleRegistering()
                }} />
            </View>)}
        </Formik>
    </View>
}

export default LoginForm