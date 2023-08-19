import { Button, Snackbar, TextInput } from "@react-native-material/core"
import { Formik, ErrorMessage } from "formik"
import { t } from "i18next"
import { View } from "react-native"
import { beginOperation, fromData, fromError, initial } from "../../lib/DataLoadState"
import { login } from "../../lib/api"
import ErrorText from "./ErrorText"
import React, { useContext, useState } from "react"
import * as yup from "yup"
import { AppContext } from "../AppContextProvider"

interface Props {
    toggleRegistering: () => void
}

const LoginForm = ({ toggleRegistering }: Props) => {
    const appContext = useContext(AppContext)
    const [loginState, setLoginstate] = useState(initial<null>(false))
    return <Formik initialValues={{ email: '', password: '' }} validationSchema={yup.object().shape({
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
        }
    }}>
    {({ handleChange, handleBlur, handleSubmit, values }) => (
        <View>
            <TextInput label={t('email_label')} textContentType="emailAddress" value={values.email}
                onChangeText={handleChange('email')} onBlur={handleBlur('email')} />
            <ErrorMessage component={ErrorText} name="email" />
            <TextInput label={t('password_label')} textContentType="password" secureTextEntry value={values.password}
                onChangeText={handleChange('password')} onBlur={handleBlur('password')} />
            <ErrorMessage component={ErrorText} name="password" />
            <Button title={t('connection_label')} variant="contained" onPress={handleSubmit} loading={loginState.loading}/>
            {loginState.error && loginState.error.message && <Snackbar message={loginState.error.message} /> }
            <Button title={t('notsubscribedyet_label')} variant="text" onPress={() => {
                toggleRegistering()
            }} />
        </View>)}
    </Formik>
}

export default LoginForm