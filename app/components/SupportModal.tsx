import { t } from "@/i18n"
import React, { useContext, useEffect } from "react"
import { Linking, ScrollView, View } from "react-native"
import { Button, IconButton, Modal, Portal, Text } from "react-native-paper"
import { lightPrimaryColor } from "./layout/constants"
import { ErrorMessage, Formik } from "formik"
import * as yup from 'yup'
import { apiUrl, clientVersion, subscriptionsUrl, linksUrl } from "@/lib/settings"
import { nativeApplicationVersion } from 'expo-application'
import { Dimensions } from "react-native"
import { AppContext } from "./AppContextProvider"
import { activityId } from "@/lib/logger"
import { ErrorText, OrangeButton, StyledLabel, TransparentTextInput } from "./layout/lib"
import ViewField from "./ViewField"

interface Props {
    visible: boolean
    onDismiss: () => void
}

let supportInfo: any

export default ({ visible, onDismiss }: Props) => {
    const appContext = useContext(AppContext)
    const load = async () => {
        const windowDims = Dimensions.get('window')
        const screenDims = Dimensions.get('screen')
        supportInfo = {
            apiUrl, subscriptionsUrl, linksUrl, clientVersion: nativeApplicationVersion || clientVersion,
            windowWidth: windowDims.width.toFixed(1), windowHeight: windowDims.height.toFixed(1), screenWidth: screenDims.width.toFixed(1),
            screenHeight: screenDims.height.toFixed(1), account: appContext.account?.id, logActivityId: activityId
        }
    }

    useEffect(() => {
        load()
    }, [])
    return <Portal>
        <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={{ padding: 20, backgroundColor: lightPrimaryColor, margin: 10, borderRadius: 15, maxHeight: '100%', maxWidth: '100%' }}>
            <View style={{ backgroundColor: lightPrimaryColor, maxHeight: Dimensions.get('window').height }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomColor: '#000', borderBottomWidth: 1, marginBottom: 10 }}>
                    <IconButton icon="close" onPress={onDismiss} />
                    <Text variant="headlineLarge" style={{ textAlign: 'center', flex: 1, paddingVertical: 10, fontSize: 24 }}>{t('support_title')}</Text>
                </View>
                <ScrollView style={{ paddingBottom: 10 }}>
                    <Text variant="headlineLarge">{t('faq_title')}</Text>
                    <Button mode="outlined" textColor="#000" style={{ alignSelf: 'flex-start', backgroundColor: '#fff', marginVertical: 10 }}
                        onPress={() => Linking.openURL(`${linksUrl}2`)}>{t('faq_button_label')}</Button>
                    <Text variant="headlineLarge">{t('send_a_message')}</Text>
                    <Text variant="bodySmall">{t('support_intro_text')}</Text>
                    <Formik initialValues={{ message: '' }} validationSchema={yup.object().shape({
                        message: yup.string().required(t('field_required'))
                    })} onSubmit={values => Linking.openURL(`mailto:topela.hello@gmail.com?subject=${encodeURI(t('support_mail_subject'))}&body=${encodeURI(values.message)}${encodeURI('\n\n')}${t('support_info')}${encodeURI(' :\n\n')}${JSON.stringify(supportInfo)}`)}>
                        {({ values, handleChange, handleBlur, submitForm }) => <>
                            <TransparentTextInput mode="outlined" multiline 
                                label={<StyledLabel label={t('support_message_label') + ' *'} />} 
                                value={values.message} onChangeText={handleChange('message')} 
                                onBlur={handleBlur('message')} style={{ marginBottom: 10 }} />
                            <ErrorMessage component={ErrorText} name="message" />
                            <OrangeButton onPress={submitForm}>{t('send_buttonCaption')}</OrangeButton>
                        </>}
                    </Formik>
                    <Text style={{ marginVertical: 10 }} variant="headlineLarge">{t('support_info')}</Text>
                    { supportInfo && Object.entries(supportInfo).map((tuple, idx) => <ViewField titleOnOwnLine key={idx} title={tuple[0]}><Text style={{ flexWrap: 'wrap' }}>{tuple[1] as string}</Text></ViewField>) }
                </ScrollView>
            </View>
        </Modal>
    </Portal>
} 