import { Formik, ErrorMessage } from "formik"
import { t } from "i18next"
import { View } from "react-native"
import React, { useContext, useState } from "react"
import * as yup from "yup"
import { AppContext } from "@/components/AppContextProvider"
import { Portal, Snackbar } from "react-native-paper"
import Icons from "@expo/vector-icons/FontAwesome"
import { OrangeBackedErrorText, OrangeTextInput, StyledLabel, WhiteButton } from "@/components/layout/lib"
import { gql, useMutation } from "@apollo/client"

const REQUEST_RECOVERY = gql`mutation RequestAccountRecovery($email: String) {
    requestAccountRecovery(input: {email: $email}) {
      integer
    }
}`

interface Props {
    toggleRecovering: () => void
}

const RecoveryForm = ({ toggleRecovering }: Props) => {
    const appContext = useContext(AppContext)
    const [recoveryRequested, setRecoveryRequested] = useState(false)
    const [requestRecovery, { loading, error, reset }] = useMutation(REQUEST_RECOVERY)

    return <Formik initialValues={{ email: '' }} validationSchema={yup.object().shape({
        email: yup.string().email(t('invalid_email')).required(t('field_required'))
    })} onSubmit={async (values) => {
        try {
            await requestRecovery({ variables: { email: values.email }})
            setRecoveryRequested(true)
        } catch(e: any) {
            appContext.actions.setMessage(e)
        }
    }}>
    {({ handleChange, handleBlur, handleSubmit, values }) => (
        <View>
            <OrangeTextInput label={<StyledLabel label={t('email_label')} />} textContentType="emailAddress" value={values.email}
                onChangeText={handleChange('email')} onBlur={handleBlur('email')} />
            <ErrorMessage component={OrangeBackedErrorText} name="email" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
                <WhiteButton style={{ flex: 1 }} icon={props => <Icons {...props} name="sign-in" />} onPress={() => handleSubmit()} 
                    loading={loading}>
                    {t('recover_label')}
                </WhiteButton>
                <WhiteButton style={{ flex: 1 }} onPress={() => toggleRecovering()}>
                    {t('cancel_caption')}
                </WhiteButton>
            </View>
            <Portal>
                <Snackbar role="alert" visible={!!error} onDismiss={() => reset()}>
                    {error && error.message}
                </Snackbar>
                <Snackbar role="note" visible={recoveryRequested} duration={60000} onDismiss={toggleRecovering}>{t('recoveryRequested_message')}</Snackbar>
            </Portal>
        </View>)}
    </Formik>
}

export default RecoveryForm