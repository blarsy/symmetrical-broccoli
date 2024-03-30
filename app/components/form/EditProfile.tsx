import { Formik, ErrorMessage } from "formik"
import React, { useContext, useState } from "react"
import * as yup from 'yup'
import { AppContext } from "@/components/AppContextProvider"
import { aboveMdWidth, adaptToWidth, pickImage } from "@/lib/utils"
import { t } from '@/i18n'
import { WhiteButton, OrangeTextInput, StyledLabel, OrangeBackedErrorText } from "@/components/layout/lib"
import { View } from "react-native"
import { gql, useMutation } from "@apollo/client"
import OperationFeedback from "../OperationFeedback"
import { Avatar, Banner } from "react-native-paper"
import { uploadImage, urlFromPublicId } from "@/lib/images"

const UPDATE_ACCOUNT = gql`mutation UpdateAccount($email: String, $name: String, $avatarPublicId: String) {
    updateAccount(input: {email: $email, name: $name, avatarPublicId: $avatarPublicId}) {
        integer
    }
}`

const initials = (text: string) => {
    if(text)
        return text.split(' ').map(word => word[0].toLocaleUpperCase()).slice(0, 2).join()

    return ""
}

export default function EditProfile () {
    const appContext = useContext(AppContext)
    const [updateAccount, { loading: updating, error, reset }] = useMutation(UPDATE_ACCOUNT)
    const [newEmailMustBeActivated, setNewEmailMustBeActivated] = useState(false)
    const [success, setSuccess] = useState(false)
    
    let initialValues = { email: '', name: '', avatarPublicId: ''}
    if(appContext.state.account) initialValues = { 
        email: appContext.state.account.email, 
        name: appContext.state.account.name,
        avatarPublicId: appContext.state.account.avatarPublicId
    }

    const update = async (values: {
        email: string;
        name: string;
        avatarPublicId: string;
    }) => {
        const currentAccount = appContext.state.account!
        let emailHasChanged = false

        if(currentAccount.email != values.email.toLowerCase()){
            emailHasChanged = true
        }

        currentAccount.email = values.email
        currentAccount.name = values.name
        currentAccount.avatarPublicId = values.avatarPublicId
        await updateAccount({ variables: currentAccount})
        setSuccess(true)

        setNewEmailMustBeActivated(emailHasChanged)

        appContext.actions.accountUpdated(currentAccount)
    }

    return <Formik initialValues={initialValues} validationSchema={yup.object().shape({
        name: yup.string().required(t('field_required')).max(30, t('name_too_long')),
        email: yup.string().email(t('invalid_email')),
        avatarPublicId: yup.string().nullable()
    })} onSubmit={update}>
    {({ handleChange, handleBlur, handleSubmit, values, setFieldValue }) => (
        <View style={{ flex: 1, padding: 10 }}>
            <Banner visible={newEmailMustBeActivated}>{t('newEmailMustBeActivated_message')}</Banner>
            <View style={{ alignItems: 'center' }}>
                { values.avatarPublicId ? 
                    <Avatar.Image source={{ uri: urlFromPublicId(values.avatarPublicId)}} size={adaptToWidth(150, 250, 300)} /> :
                    <Avatar.Text label={initials(values.name)} size={adaptToWidth(150, 250, 300)} />}
            </View>
            <WhiteButton style={{ alignSelf: 'center', marginVertical: 10}} onPress={() => pickImage(async img => {
                const avatarPublicId = await uploadImage(img.uri)
                setFieldValue('avatarPublicId', avatarPublicId)
                update({ ...values, ...{ avatarPublicId }})
            }, 200, appContext)}>
                {t('modify_logo')}
            </WhiteButton>
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