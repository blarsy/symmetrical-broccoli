import { Formik, ErrorMessage } from "formik"
import React, { useContext, useState } from "react"
import * as yup from 'yup'
import { AppContext } from "@/components/AppContextProvider"
import { aboveMdWidth } from "@/lib/utils"
import { t } from '@/i18n'
import { WhiteButton, OrangeTextInput, StyledLabel, OrangeBackedErrorText } from "@/components/layout/lib"
import { View } from "react-native"
import { gql, useMutation } from "@apollo/client"
import OperationFeedback from "../OperationFeedback"

const UPDATE_ACCOUNT = gql`mutation UpdateAccount($email: String, $name: String) {
    updateAccount(input: {email: $email, name: $name}) {
        integer
    }
}`

export default function EditProfile () {
    const appContext = useContext(AppContext)
    const [updateAccount, { loading: updating, error, reset }] = useMutation(UPDATE_ACCOUNT)
    const [success, setSuccess] = useState(false)
    
    let initialValues = { email: '', name: ''}
    if(appContext.state.account) initialValues = { 
        email: appContext.state.account.email, 
        name: appContext.state.account.name
    }

    return <Formik initialValues={initialValues} validationSchema={yup.object().shape({
        name: yup.string().max(30, t('name_too_long')),
        email: yup.string().email(t('invalid_email'))
    })} onSubmit={async (values) => {
        const currentAccount = appContext.state.account!
        currentAccount.email = values.email
        currentAccount.name = values.name
        await updateAccount({ variables: { name: values.name, email: values.email }})
        setSuccess(true)
        appContext.actions.accountUpdated(currentAccount)

    }}>
    {({ handleChange, handleBlur, handleSubmit, values }) => (
        <View style={{ flex: 1, padding: 10 }}>
            <OrangeTextInput style={{ flex: 1 }} label={<StyledLabel label={t('organization_name_label')} color="#fff"/>} textContentType="name" value={values.name}
                onChangeText={handleChange('name')} onBlur={handleBlur('name')} />
            <ErrorMessage component={OrangeBackedErrorText} name="name" />
            <OrangeTextInput label={<StyledLabel label={t('email_label')} color="#fff"/>} textContentType="emailAddress" value={values.email}
                onChangeText={handleChange('email')} onBlur={handleBlur('email')} />
            <ErrorMessage component={OrangeBackedErrorText} name="email" />
            <WhiteButton style={{ marginTop: 20, width: aboveMdWidth() ? '60%' : '80%', alignSelf: 'center' }} onPress={e => handleSubmit()} loading={updating}>
                {t('save_label')}
            </WhiteButton>
            <OperationFeedback error={error} success={success} onDismissError={reset} onDismissSuccess={() => setSuccess(false)} />
        </View>)}
    </Formik>
}