import { Formik, ErrorMessage } from "formik"
import React, { useContext, useState } from "react"
import * as yup from 'yup'
import { AppContext } from "@/components/AppContextProvider"
import { isValidPassword } from "@/lib/utils"
import { t } from '@/i18n'
import { WhiteButton, OrangeTextInput, StyledLabel, OrangeBackedErrorText } from "@/components/layout/lib"
import { View } from "react-native"
import { gql, useMutation } from "@apollo/client"
import OperationFeedback from "../OperationFeedback"

interface Props {
    onDone:  (success: boolean) => void
}

const CHANGE_PASSWORD = gql`mutation ChangePassword($newPassword: String, $oldPassword: String) {
    changePassword(input: {newPassword: $newPassword, oldPassword: $oldPassword}) {
        integer
    }
}`

export default function ChangePassword ({ onDone }: Props) {
    const appContext = useContext(AppContext)
    const [changePassword, { loading: changing, error, reset }] = useMutation(CHANGE_PASSWORD)

    let initialValues = { password: '', newPassword: '', passwordRepeat: ''}
    if(appContext.state.account) initialValues = { 
        password: '', 
        newPassword: '',
        passwordRepeat: ''
    }

    return <Formik initialValues={initialValues} validationSchema={yup.object().shape({
        password: yup.string().required(t('field_required')).test({ 
            message: t('field_required'), 
            test: (val, ctx) => !!val || (!ctx.parent.newPassword && !ctx.parent.passwordRepeat)
        }),
        newPassword: yup.string().required(t('field_required')).test({ 
            name: 'passwordValid', 
            message: t('password_invalid'), 
            test: isValidPassword
        }).test({
            message: t('field_required'), 
            test: (val, ctx) => !!val || (!ctx.parent.password && !ctx.parent.passwordRepeat) 
        }),
        passwordRepeat: yup.string().required(t('field_required')).test({
            name: 'repeatPasswordIdenticalToPassword',
            message: t('passwords_dont_match'),
            test: (val, ctx) => val === ctx.parent.newPassword
        }).test({ 
            message: t('field_required'), 
            test: (val, ctx) => !!val || (!ctx.parent.password && !ctx.parent.newPassword) 
        })
    })} onSubmit={async (values) => {
        await changePassword({ variables: { newPassword: values.newPassword, oldPassword: values.password } })
        onDone(true)
    }}>
    {({ handleChange, handleBlur, handleSubmit, values }) => (
        <View style={{ flex: 1, padding: 10 }}>
            <OrangeTextInput label={<StyledLabel label={t('password_label')} color="#fff"/>} textContentType="password" secureTextEntry value={values.password}
                onChangeText={handleChange('password')} onBlur={handleBlur('password')} />
            <ErrorMessage component={OrangeBackedErrorText} name="password" />
            <OrangeTextInput label={<StyledLabel label={t('newpassword_label')} color="#fff"/>} textContentType="password" secureTextEntry value={values.newPassword}
                onChangeText={handleChange('newPassword')} onBlur={handleBlur('newPassword')} />
            <ErrorMessage component={OrangeBackedErrorText} name="newPassword" />
            <OrangeTextInput label={<StyledLabel label={t('repeatnewpassword_label')} color="#fff"/>} textContentType="password" secureTextEntry value={values.passwordRepeat}
                onChangeText={handleChange('passwordRepeat')} onBlur={handleBlur('passwordRepeat')} />
            <ErrorMessage component={OrangeBackedErrorText} name="passwordRepeat" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
            <WhiteButton style={{ flex: 1 }} onPress={e => handleSubmit()} loading={changing}>
                    {t('ok_caption')}
                </WhiteButton>
                <WhiteButton style={{ flex: 1 }} onPress={e => onDone(false)}>
                    {t('cancel_caption')}
                </WhiteButton>
            </View>
            <OperationFeedback error={error} onDismissError={reset} />
        </View>)}
    </Formik>
}