import { Formik, ErrorMessage } from "formik"
import { t } from "i18next"
import { View } from "react-native"
import { beginOperation, fromData, fromError, initial } from "@/lib/DataLoadState"
import { OrangeBackedErrorText } from "./ErrorText"
import React, { useContext, useState } from "react"
import * as yup from "yup"
import { AppContext } from "@/components/AppContextProvider"
import OrangeTextInput from "./OrangeTextInput"
import { Portal, Snackbar } from "react-native-paper"
import Icons from "@expo/vector-icons/FontAwesome"
import { WhiteButton } from "@/components/layout/lib"
import { requestRecovery } from "@/lib/api"

interface Props {
    toggleRecovering: () => void
}

const RecoveryForm = ({ toggleRecovering }: Props) => {
    const appContext = useContext(AppContext)
    const [requestRecoveryState, setRequestRecoveryState] = useState(initial<null>(false))
    const [recoveryRequested, setRecoveryRequested] = useState(false)

    return <Formik initialValues={{ email: '' }} validationSchema={yup.object().shape({
        email: yup.string().email(t('invalid_email')).required(t('field_required'))
    })} onSubmit={async (values) => {
        setRequestRecoveryState(beginOperation())
        try {
            await requestRecovery(values.email)
            setRequestRecoveryState(fromData(null))
            setRecoveryRequested(true)
        } catch(e: any) {
            setRequestRecoveryState(fromError(e, t('requestError')))
            appContext.actions.setMessage(e)
        }
    }}>
    {({ handleChange, handleBlur, handleSubmit, values }) => (
        <View>
            <OrangeTextInput label={t('email_label')} textContentType="emailAddress" value={values.email}
                onChangeText={handleChange('email')} onBlur={handleBlur('email')} />
            <ErrorMessage component={OrangeBackedErrorText} name="email" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <WhiteButton style={{ flex: 1 }} icon={props => <Icons {...props} name="sign-in" />} onPress={() => handleSubmit()} 
                    loading={requestRecoveryState.loading}>
                    {t('connection_label')}
                </WhiteButton>
                <WhiteButton style={{ flex: 1 }} onPress={() => toggleRecovering()} 
                    loading={requestRecoveryState.loading}>
                    {t('cancel_caption')}
                </WhiteButton>
            </View>
            <Portal>
                <Snackbar role="alert" visible={!!requestRecoveryState.error && !!requestRecoveryState.error.message} onDismiss={() => setRequestRecoveryState(initial<null>(false))}>
                    {requestRecoveryState.error && requestRecoveryState.error.message}
                </Snackbar>
                <Snackbar role="note" visible={recoveryRequested} onDismiss={toggleRecovering}>{t('recoveryRequested_message')}</Snackbar>
            </Portal>
        </View>)}
    </Formik>
}

export default RecoveryForm