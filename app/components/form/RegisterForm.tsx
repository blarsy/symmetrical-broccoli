import { Formik, ErrorMessage } from "formik"
import { t } from "i18next"
import React, { useContext, useState } from "react"
import { beginOperation, fromData, fromError, initial } from "../../lib/DataLoadState"
import { register } from "../../lib/api"
import { OrangeBackedErrorText } from "./ErrorText"
import * as yup from 'yup'
import { StyleProp, View, ViewStyle } from "react-native"
import { AppContext } from "../AppContextProvider"
import OrangeTextInput from "./OrangeTextInput"
import { Button, Portal, Snackbar } from "react-native-paper"
import { WhiteButton } from "../layout/lib"

interface Props {
    toggleRegistering: () => void,
    style: StyleProp<ViewStyle>
}

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
            <View style={{ flex: 1, flexDirection: 'row', gap: 10, justifyContent: 'center', marginTop: 20 }}>
            <WhiteButton style={{ flex: 1, flexShrink: 0, flexBasis: '40%' }} onPress={e => { handleSubmit() }} loading={registerState.loading}>
                    {t('ok_caption')}
                </WhiteButton>
                <Portal>
                    <Snackbar visible={!!registerState.error && !!registerState.error.message} onDismiss={() => setRegisterState(initial<null>(false))}>{registerState.error && registerState.error.message}</Snackbar>
                </Portal>
                <WhiteButton style={{ flex: 1, flexShrink: 0, flexBasis: '40%' }} onPress={() => {
                    toggleRegistering()
                }}>
                    {t('cancel_caption')}
                </WhiteButton>
            </View>
        </View>)}
    </Formik>
}

export default RegisterForm