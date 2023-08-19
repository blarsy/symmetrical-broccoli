import { Wrap, Snackbar, TextInput, Button } from "@react-native-material/core"
import { Formik, ErrorMessage } from "formik"
import { t } from "i18next"
import React, { useContext, useState } from "react"
import { beginOperation, fromData, fromError, initial } from "../../lib/DataLoadState"
import { register } from "../../lib/api"
import ErrorText from "./ErrorText"
import * as yup from 'yup'
import { View } from "react-native"
import { AppContext } from "../AppContextProvider"

interface Props {
    toggleRegistering: () => void
}

const RegisterForm = ({ toggleRegistering }: Props) => {
    const appContext = useContext(AppContext)
    const [registerState, setRegisterState] = useState(initial<null>(false))
    return <Formik initialValues={{ email: '', password: '', repeatPassword: '', name: '' }} validationSchema={yup.object().shape({
        name: yup.string().required(t('field_required')),
        email: yup.string().email(t('invalid_email')).required(t('field_required')),
        password: yup.string().required(t('field_required')),
        repeatPassword: yup.string().required(t('field_required')).test('passwordsIdentical', t('passwords_dont_match'), (val, ctx) => val === ctx.parent.password )
    })} onSubmit={async (values) => {
        setRegisterState(beginOperation())
        try {
            const res = await register(values.email, values.password, values.name)
            const data = await res.json()
            appContext.actions.loginComplete(data.token, data.account)
            setRegisterState(fromData(null))
        } catch(e: any) {
            setRegisterState(fromError(e, t('registration_error')))
        }
    }}>
    {({ handleChange, handleBlur, handleSubmit, values }) => (
        <View>
            <TextInput label={t('name_label')} textContentType="givenName" value={values.name}
                onChangeText={handleChange('name')} onBlur={handleBlur('name')} />
            <ErrorMessage component={ErrorText} name="name" />
            <TextInput label={t('email_label')} textContentType="emailAddress" value={values.email}
                onChangeText={handleChange('email')} onBlur={handleBlur('email')} />
            <ErrorMessage component={ErrorText} name="email" />
            <TextInput label={t('password_label')} textContentType="password" secureTextEntry value={values.password}
                onChangeText={handleChange('password')} onBlur={handleBlur('password')} />
            <ErrorMessage component={ErrorText} name="password" />
            <TextInput label={t('repeatpassword_label')} textContentType="password" secureTextEntry value={values.repeatPassword}
                onChangeText={handleChange('repeatPassword')} onBlur={handleBlur('repeatPassword')} />
            <ErrorMessage component={ErrorText} name="repeatPassword" />
            <Wrap spacing={3} justify="center">
                <Button title={t('ok_caption')} variant="contained" onPress={e => {
                    handleSubmit(e)
                }} loading={registerState.loading}/>
                {registerState.error && registerState.error.message && <Snackbar message={registerState.error.message} /> }
                <Button title={t('cancel_caption')} onPress={() => {
                    toggleRegistering()
                }} />
            </Wrap>
        </View>)}
    </Formik>
}

export default RegisterForm