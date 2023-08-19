import { Button, Flex, Icon, IconButton, IconComponentProvider, Snackbar, TextInput } from "@react-native-material/core"
import { Formik, ErrorMessage } from "formik"
import React, { useContext, useState } from "react"
import { View } from "react-native"
import { beginOperation, fromData, fromError, initial } from "../lib/DataLoadState"
import { updateAccount } from "../lib/api"
import ErrorText from "./form/ErrorText"
import * as yup from 'yup'
import { AppContext } from "./AppContextProvider"
import { isValidPassword } from "../lib/utils"
import { MaterialIcons } from "@expo/vector-icons"
import { t } from '../i18n'

export default function Profile () {
    const appContext = useContext(AppContext)
    const [updateProfileState, setUpdateProfileState] = useState(initial<null>(false))

    let initialValues = { email: '', password: '', name: '', newPassword: '', passwordRepeat: ''}
    if(appContext.state.account) initialValues = { 
        email: appContext.state.account.email, 
        password: '', 
        name: appContext.state.account.name, 
        newPassword: '',
        passwordRepeat: ''
    }

    return <Flex items="stretch" style={{ margin: '1rem', flex: 1, justifyContent: 'flex-start' }}>
        <Formik initialValues={initialValues} validationSchema={yup.object().shape({
            name: yup.string().max(30, t('name_too_long')),
            email: yup.string().email(t('invalid_email')),
            password: yup.string().test({ 
                message: t('field_required'), 
                test: (val, ctx) => !!val || (!ctx.parent.newPassword && !ctx.parent.passwordRepeat)
            }),
            newPassword: yup.string().test({ 
                name: 'passwordValid', 
                message: t('password_invalid'), 
                test: val => !val || isValidPassword(val)
            }).test({
                message: t('field_required'), 
                test: (val, ctx) => !!val || (!ctx.parent.password && !ctx.parent.passwordRepeat) 
            }),
            passwordRepeat: yup.string().test({
                name: 'repeatPasswordIdenticalToPassword',
                message: t('passwords_dont_match'),
                test: (val, ctx) => val === ctx.parent.newPassword
            }).test({ 
                message: t('field_required'), 
                test: (val, ctx) => !!val || (!ctx.parent.password && !ctx.parent.newPassword) 
            })
        })} onSubmit={async (values) => {
            setUpdateProfileState(beginOperation())
            try {
                const updatedAccount = await updateAccount(appContext.state.token.data!, values.password, values.newPassword, values.name, values.email)
                setUpdateProfileState(fromData(null))
                appContext.actions.accountUpdated(updatedAccount)
            } catch(e: any) {
                setUpdateProfileState(fromError(e, t('passwords_dont_match')))
            }
        }}>
        {({ handleChange, handleBlur, handleSubmit, values }) => (
            <IconComponentProvider IconComponent={MaterialIcons}>
                <View>
                    <Flex direction="row">
                        <TextInput style={{ flex: 1 }} label={t('name_label')} textContentType="name" value={values.name}
                            onChangeText={handleChange('name')} onBlur={handleBlur('name')} />
                        <IconButton icon={props => <Icon name="logout" {...props}/>} onPress={e => appContext.actions.logout()} />
                    </Flex>
                    <ErrorMessage component={ErrorText} name="name" />
                    <TextInput label={t('email_label')} textContentType="emailAddress" value={values.email}
                        onChangeText={handleChange('email')} onBlur={handleBlur('email')} />
                    <ErrorMessage component={ErrorText} name="email" />
                    <TextInput label={t('password_label')} textContentType="password" secureTextEntry value={values.password}
                        onChangeText={handleChange('password')} onBlur={handleBlur('password')} />
                    <ErrorMessage component={ErrorText} name="password" />
                    <TextInput label={t('newpassword_label')} textContentType="password" secureTextEntry value={values.newPassword}
                        onChangeText={handleChange('newPassword')} onBlur={handleBlur('newPassword')} />
                    <ErrorMessage component={ErrorText} name="newPassword" />
                    <TextInput label={t('repeatnewpassword_label')} textContentType="password" secureTextEntry value={values.passwordRepeat}
                        onChangeText={handleChange('passwordRepeat')} onBlur={handleBlur('passwordRepeat')} />
                    <ErrorMessage component={ErrorText} name="passwordRepeat" />
                    <Button title={t('save_label')} variant="contained" onPress={handleSubmit} loading={updateProfileState.loading}/>
                    {updateProfileState.error && updateProfileState.error.message && <Snackbar message={updateProfileState.error.message} /> }
                </View>
            </IconComponentProvider>)}
        </Formik>
    </Flex>
}