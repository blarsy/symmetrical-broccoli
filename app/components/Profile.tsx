import { Button, Flex, Snackbar, TextInput } from "@react-native-material/core"
import { Formik, ErrorMessage } from "formik"
import React, { useContext, useState } from "react"
import { View } from "react-native"
import { beginOperation, fromData, fromError, initial } from "../lib/DataLoadState"
import { updateAccount } from "../lib/api"
import ErrorText from "./form/ErrorText"
import * as yup from 'yup'
import { AppContext } from "./AppContextProvider"
import { isValidPassword } from "../lib/utils"

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
            name: yup.string().max(30, 'Veuillez utiliser un nom plus court'),
            email: yup.string().email('adresse email invalide'),
            password: yup.string().test({ 
                message: 'Ce champ est requis', 
                test: (val, ctx) => !!val || (!ctx.parent.newPassword && !ctx.parent.passwordRepeat)
            }),
            newPassword: yup.string().test({ 
                name: 'passwordValid', 
                message: 'Le mot de passe doit comporter au moins 8 caractères, au moins une majustcule et un chiffre.', 
                test: val => !val || isValidPassword(val)
            }).test({
                message: 'Ce champ est requis', 
                test: (val, ctx) => !!val || (!ctx.parent.password && !ctx.parent.passwordRepeat) 
            }),
            passwordRepeat: yup.string().test({
                name: 'repeatPasswordIdenticalToPassword',
                message: 'Les mots de passe fournis ne sont pas identiques',
                test: (val, ctx) => val === ctx.parent.newPassword
            }).test({ 
                message: 'Ce champ est requis', 
                test: (val, ctx) => !!val || (!ctx.parent.password && !ctx.parent.newPassword) 
            })
        })} onSubmit={async (values) => {
            setUpdateProfileState(beginOperation())
            try {
                const updatedAccount = await updateAccount(appContext.state.token, values.password, values.newPassword, values.name, values.email)
                setUpdateProfileState(fromData(null))
                appContext.actions.accountUpdated(updatedAccount)
            } catch(e: any) {
                setUpdateProfileState(fromError(e, 'Erreur lors de la sauvegarde.'))
            }
        }}>
        {({ handleChange, handleBlur, handleSubmit, values }) => (
            <View>
                <TextInput label="Nom" textContentType="name" value={values.name}
                    onChangeText={handleChange('name')} onBlur={handleBlur('name')} />
                <ErrorMessage component={ErrorText} name="name" />
                <TextInput label="Email" textContentType="emailAddress" value={values.email}
                    onChangeText={handleChange('email')} onBlur={handleBlur('email')} />
                <ErrorMessage component={ErrorText} name="email" />
                <TextInput label="Mot de passe" textContentType="password" secureTextEntry value={values.password}
                    onChangeText={handleChange('password')} onBlur={handleBlur('password')} />
                <ErrorMessage component={ErrorText} name="password" />
                <TextInput label="Nouveau mot de passe" textContentType="password" secureTextEntry value={values.newPassword}
                    onChangeText={handleChange('newPassword')} onBlur={handleBlur('newPassword')} />
                <ErrorMessage component={ErrorText} name="newPassword" />
                <TextInput label="Répétition nouveau mot de passe" textContentType="password" secureTextEntry value={values.passwordRepeat}
                    onChangeText={handleChange('passwordRepeat')} onBlur={handleBlur('passwordRepeat')} />
                <ErrorMessage component={ErrorText} name="passwordRepeat" />
                <Button title="Sauver" variant="contained" onPress={handleSubmit} loading={updateProfileState.loading}/>
                {updateProfileState.error && updateProfileState.error.message && <Snackbar message={updateProfileState.error.message} /> }
            </View>)}
        </Formik>
    </Flex>
}