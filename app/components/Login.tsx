import React, { Fragment, useContext, useState } from "react"
import { Flex } from 'react-native-flex-layout'
import { Button, Snackbar, TextInput } from "@react-native-material/core"
import { AppBar } from "@react-native-material/core"
import { beginOperation, fromData, fromError, initial } from "../lib/DataLoadState"
import { login } from "../lib/api"
import { ErrorMessage, Formik } from "formik"
import * as yup from 'yup'
import { View } from "react-native"
import ErrorText from "./form/ErrorText"
import { AppContext } from "./AppContextProvider"



export default function Login () {
    const appContext = useContext(AppContext)
    const [loginState, setLoginstate] = useState(initial<null>(false))
    return <Fragment>
        <AppBar title="Connexion" />
        <Flex items="stretch" style={{ margin: '1rem', flex: 1, justifyContent: 'center' }}>
            <Formik initialValues={{ email: '', password: '' }} validationSchema={yup.object().shape({
                email: yup.string().email('adresse email invalide').required('Ce champ est requis'),
                password: yup.string().required('Ce champ est requis')
            })} onSubmit={async (values) => {
                setLoginstate(beginOperation())
                try {
                    const res = await login(values.email, values.password)
                    const data = await res.json()
                    appContext.actions.loginComplete(data.token, data.account)
                    setLoginstate(fromData(null))
                } catch(e: any) {
                    setLoginstate(fromError(e, 'Erreur lors de la connexion.'))
                }
            }}>
            {({ handleChange, handleBlur, handleSubmit, values }) => (
                <View>
                    <TextInput label="Email" textContentType="emailAddress" value={values.email}
                        onChangeText={handleChange('email')} onBlur={handleBlur('email')} />
                    <ErrorMessage component={ErrorText} name="email" />
                    <TextInput label="Mot de passe" textContentType="password" secureTextEntry value={values.password}
                        onChangeText={handleChange('password')} onBlur={handleBlur('password')} />
                    <ErrorMessage component={ErrorText} name="password" />
                    <Button title="Connexion" variant="contained" onPress={handleSubmit} loading={loginState.loading}/>
                    {loginState.error && loginState.error.message && <Snackbar message={loginState.error.message} /> }
                </View>)}
            </Formik>
        </Flex>
    </Fragment>
}