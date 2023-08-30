import { Wrap, Snackbar, TextInput, Button, TextInputProps } from "@react-native-material/core"
import { Formik, ErrorMessage, ErrorMessageProps } from "formik"
import { t } from "i18next"
import React, { useContext, useState } from "react"
import { beginOperation, fromData, fromError, initial } from "../../lib/DataLoadState"
import { register } from "../../lib/api"
import ErrorText, { OrangeBackedErrorText } from "./ErrorText"
import * as yup from 'yup'
import { StyleProp, View, ViewStyle } from "react-native"
import { AppContext } from "../AppContextProvider"
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

const RegisterForm = ({ toggleRegistering, style }: Props) => {
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
        <View style={style}>
            <OrangeTextInput label={t('name_label')} textContentType="givenName" value={values.name}
                onChangeText={handleChange('name')} onBlur={handleBlur('name')} />
            <ErrorMessage component={OrangeBackedErrorText} name="name" />
            <OrangeTextInput label={t('email_label')} textContentType="emailAddress" value={values.email}
                onChangeText={handleChange('email')} onBlur={handleBlur('email')} />
            <ErrorMessage component={OrangeBackedErrorText} name="email" />
            <OrangeTextInput label={t('password_label')} textContentType="password" secureTextEntry value={values.password}
                onChangeText={handleChange('password')} onBlur={handleBlur('password')} />
            <ErrorMessage component={OrangeBackedErrorText} name="password" />
            <OrangeTextInput label={t('repeatpassword_label')} textContentType="password" secureTextEntry value={values.repeatPassword}
                onChangeText={handleChange('repeatPassword')} onBlur={handleBlur('repeatPassword')} />
            <ErrorMessage component={OrangeBackedErrorText} name="repeatPassword" />
            <Wrap spacing={3} justify="center">
                <Button tintColor="#000" color="#fff" title={t('ok_caption')} variant="contained" onPress={e => {
                    handleSubmit(e)
                }} loading={registerState.loading}/>
                {registerState.error && registerState.error.message && <Snackbar message={registerState.error.message} /> }
                <Button tintColor="#000" color="#fff" title={t('cancel_caption')} onPress={() => {
                    toggleRegistering()
                }} />
            </Wrap>
        </View>)}
    </Formik>
}

export default RegisterForm