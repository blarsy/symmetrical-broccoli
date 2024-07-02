import { Link } from "@/lib/schema"
import React, { useState } from "react"
import { Modal, Portal, Text } from "react-native-paper"
import { lightPrimaryColor } from "../layout/constants"
import { t } from "@/i18n"
import { View } from "react-native"
import { ErrorText, OrangeButton, StyledLabel, TransparentTextInput } from "../layout/lib"
import { ErrorMessage, Formik } from "formik"
import LinkTypeSelect from "../form/LinkTypeSelect"
import { ErrorSnackbar } from "../OperationFeedback"
import * as yup from 'yup'

interface EditLinkModalProps {
    initial?: Link
    visible: boolean
    onDismiss: (link?: Link) => void
}

export default ({ initial, visible, onDismiss }: EditLinkModalProps) => {
    const [error, setError] = useState<Error | undefined>(undefined)
    return <Portal>
        <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ padding: 20, backgroundColor: lightPrimaryColor, margin: 10, borderRadius: 15 }}>
            <Formik initialValues={initial || { id: 0, url: '', label: '', type: 4 }} 
                validationSchema={yup.object().shape({
                    url: yup.string().required(t('field_required')).url(t('not_a_valid_url')),
                    label: yup.string().max(30, t('link_label_too_long'))
                })} onSubmit={(values) => {
                    try{
                        onDismiss(values)
                    } catch(e) {
                        setError(e as Error)
                    }
                }}>
            {({ values, setFieldValue, handleChange, handleBlur, submitForm }) => {
                return <View>
                    <Text variant="headlineLarge" style={{ textAlign: 'center', paddingVertical: 10, borderBottomColor: '#000', borderBottomWidth: 1, fontSize: 24 }}>{t('link_dialog_title')}</Text>
                    <View style={{ paddingVertical: 25, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 5 }}>
                        <TransparentTextInput label={<StyledLabel label={t('url_label') + ' *'} />} value={values.url} onChangeText={handleChange('url')} onBlur={handleBlur('url')}/>
                        <ErrorMessage component={ErrorText} name="url" />
                        <TransparentTextInput label={<StyledLabel label={t('link_label_label') } />} value={values.label} onChangeText={handleChange('label')} onBlur={handleBlur('label')}/>
                        <ErrorMessage component={ErrorText} name="label" />
                        <LinkTypeSelect style={{ alignSelf: 'center' }} selected={values.type} onSelectedChanged={newType => setFieldValue('type', newType)} />
                    </View>
                    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 10 }}>
                        <OrangeButton onPress={() => onDismiss()}>{t('close_buttonCaption')}</OrangeButton>
                        <OrangeButton onPress={submitForm}>{t('done_buttonCaption')}</OrangeButton>
                    </View>
                </View>
            }}
            </Formik>
            <Portal>
                <ErrorSnackbar error={error} message={error && t('requestError')} onDismissError={() => setError(undefined)} />
            </Portal>
        </Modal>
    </Portal>
}