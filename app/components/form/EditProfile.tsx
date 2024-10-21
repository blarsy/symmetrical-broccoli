import { Formik, ErrorMessage } from "formik"
import React, { useContext, useState } from "react"
import * as yup from 'yup'
import { aboveMdWidth, adaptToWidth, initials, pickImage } from "@/lib/utils"
import { t } from '@/i18n'
import { WhiteButton, OrangeTextInput, StyledLabel, OrangeBackedErrorText } from "@/components/layout/lib"
import { View } from "react-native"
import { gql, useMutation } from "@apollo/client"
import OperationFeedback from "../OperationFeedback"
import { ActivityIndicator, Avatar, Banner } from "react-native-paper"
import { uploadImage, urlFromPublicId } from "@/lib/images"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import { AccountInfo } from "@/lib/schema"

const UPDATE_ACCOUNT = gql`mutation UpdateAccount($email: String, $name: String, $avatarPublicId: String) {
    updateAccount(
      input: {email: $email, name: $name, avatarPublicId: $avatarPublicId}
    ) {
      integer
    }
}`

export default function EditProfile () {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const [updateAccount, { loading: updating, error: updateError, reset }] = useMutation(UPDATE_ACCOUNT)
    const [newEmailMustBeActivated, setNewEmailMustBeActivated] = useState(false)
    const [success, setSuccess] = useState(false)

    const update = async (values: {
        email: string
        name: string
        avatarPublicId: string
    }) => {
        const currentAccount = appContext.account! as AccountInfo & { links: any[] }
        let emailHasChanged = false

        if(currentAccount.email != values.email.toLowerCase()){
            emailHasChanged = true
        }

        currentAccount.email = values.email
        currentAccount.name = values.name
        currentAccount.avatarPublicId = values.avatarPublicId
        
        await updateAccount({ variables: currentAccount })
        setSuccess(true)

        setNewEmailMustBeActivated(emailHasChanged)

        appDispatch({ type: AppReducerActionType.UpdateAccount, payload: currentAccount })
    }

    if(!appContext.account) return <ActivityIndicator/>

    return <Formik initialValues={{ email: appContext.account!.email, 
        name: appContext.account!.name,
        avatarPublicId: appContext.account!.avatarPublicId }} validationSchema={yup.object().shape({
        name: yup.string().required(t('field_required')).max(30, t('name_too_long')),
        email: yup.string().email(t('invalid_email')),
        avatarPublicId: yup.string().nullable()
    })} onSubmit={update}>
    {({ handleChange, handleBlur, handleSubmit, values, setFieldValue, isValid, submitCount }) => (
        <View style={{ flex: 1, padding: 10 }}>
            <Banner testID="emailChangingBanner" visible={newEmailMustBeActivated}>{t('newEmailMustBeActivated_message')}</Banner>
            <View style={{ alignItems: 'center' }}>
                { values.avatarPublicId ? 
                    <Avatar.Image source={{ uri: urlFromPublicId(values.avatarPublicId)}} size={adaptToWidth(150, 250, 300)} /> :
                    <Avatar.Text label={initials(values.name)} size={adaptToWidth(150, 250, 300)} />}
            </View>
            <WhiteButton style={{ alignSelf: 'center', marginVertical: 10}} onPress={() => pickImage(async img => {
                try {
                    const avatarPublicId = await uploadImage(img.uri)
                    setFieldValue('avatarPublicId', avatarPublicId)
                    await update({ ...values, ...{ avatarPublicId }})
                    appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { message: t('logoChangedMessage') } })
                } catch (e) {
                    appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: e as Error} })
                }
            }, 200)}>
                {t('modify_logo')}
            </WhiteButton>
            <OrangeTextInput testID="name" style={{ flex: 1 }} label={<StyledLabel label={t('organization_name_label')}
                color="#fff"/>} textContentType="name" value={values.name}
                onChangeText={handleChange('name')} onBlur={handleBlur('name')} />
            <ErrorMessage component={OrangeBackedErrorText} name="name" />
            <OrangeTextInput testID="email" label={<StyledLabel label={t('email_label')} color="#fff"/>} textContentType="emailAddress" value={values.email}
                onChangeText={handleChange('email')} onBlur={handleBlur('email')} />
            <ErrorMessage component={OrangeBackedErrorText} name="email" />
            <View style={{ marginTop: 20, width: aboveMdWidth() ? '60%' : '80%', alignSelf: 'center' }}>
                { submitCount > 0 && !isValid && <OrangeBackedErrorText>{t('someDataInvalid')}</OrangeBackedErrorText> }
                <WhiteButton testID="save" disabled={updating} onPress={e => handleSubmit()} loading={updating}>
                    {t('save_label')}
                </WhiteButton>
            </View>
            <OperationFeedback testID="editProfileFeedback" error={updateError} success={success} onDismissError={reset} onDismissSuccess={() => setSuccess(false)} />
        </View>)}
    </Formik>  
}