import { ErrorMessage, Formik } from "formik"
import React, { useContext, useEffect, useState } from "react"
import { Dimensions, Linking, ScrollView } from "react-native"
import { Text } from "react-native-paper"
import * as yup from 'yup'
import { ErrorText, OrangeButton, StyledLabel, TransparentTextInput } from "../layout/lib"
import { graphQlApiUrl, clientVersion, linksUrl, subscriptionsUrl, apiUrl } from "@/lib/settings"
import ViewField from "../ViewField"
import { t } from "@/i18n"
import { AppContext } from "../AppContextProvider"
import { activityId } from "@/lib/logger"
import { nativeApplicationVersion } from 'expo-application'
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import LoadedZone from "../LoadedZone"

export default () => {
    const appContext = useContext(AppContext)
    const [supportInfo, setSupportInfo] = useState(initial<any>(true, {}))
    const load = async () => {
        try {
            const windowDims = Dimensions.get('window')
            const screenDims = Dimensions.get('screen')
            const supportInfo = {
                graphQlApiUrl, apiUrl, subscriptionsUrl, linksUrl, clientVersion: nativeApplicationVersion || clientVersion,
                windowWidth: windowDims.width.toFixed(1), windowHeight: windowDims.height.toFixed(1), screenWidth: screenDims.width.toFixed(1),
                screenHeight: screenDims.height.toFixed(1), account: appContext.account?.id, logActivityId: activityId
            }
            setSupportInfo(fromData(supportInfo))
        } catch (e) {
            setSupportInfo(fromError(e, t('requestError')))
        }
    }

    useEffect(() => {
        load()
    }, [])

    return <ScrollView>
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
        <LoadedZone loading={supportInfo.loading} error={supportInfo.error}>
            { Object.entries(supportInfo.data).map((tuple, idx) => <ViewField titleOnOwnLine key={idx} title={tuple[0]} style={{ paddingBottom: 0, marginBottom: 0 }}><Text style={{ flexWrap: 'wrap' }}>{tuple[1] as string}</Text></ViewField>) }
        </LoadedZone>
    </ScrollView>
}