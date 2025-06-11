import { Modal, Portal, Text } from "react-native-paper"
import { lightPrimaryColor } from "../layout/constants"
import React from "react"
import { t } from "@/i18n"
import { ErrorMessage, Formik } from "formik"
import * as yup from "yup"
import { ErrorText, OrangeButton, StyledLabel, TransparentTextInput } from "../layout/lib"
import { View } from "react-native"
import { gql, useMutation } from "@apollo/client"

interface Props {
    toAccount: number | undefined
    accountName: string
    onDismiss: () => void
    testID?: string
}

const SEND_TOKENS = gql`mutation SendTokens($amountToSend: Int, $targetAccountId: Int) {
    sendTokens(
      input: {amountToSend: $amountToSend, targetAccountId: $targetAccountId}
    ) {
      integer
    }
}`

const SendTokensDialog = (p: Props) => {
    const [sendTokens, { loading: sending }] = useMutation(SEND_TOKENS)
    return <Portal>
        <Modal visible={!!p.toAccount} onDismiss={p.onDismiss} 
            contentContainerStyle={{ padding: 20, backgroundColor: lightPrimaryColor, margin: 10, borderRadius: 15 }}
            dismissableBackButton dismissable>
            <Text variant="headlineLarge" style={{ textAlign: 'center', paddingVertical: 10, fontSize: 24 }}>{t('sendTokensTitle', { accountName: p.accountName })}</Text>
            <Formik initialValues={{ amountToSend: 0 }} validationSchema={yup.object().shape({
                amountToSend: yup.number().moreThan(0, t('mustBeNonNullPositive')).required(t('field_required'))
            })} onSubmit={async values => {
                await sendTokens({ variables: { amountToSend: Number(values.amountToSend), targetAccountId: p.toAccount } })
                p.onDismiss()
            }}>
                {f => <View style={{ gap: 10 }}>
                    <TransparentTextInput testID={`${p.testID}:AmountToSend`} label={<StyledLabel label={t('amountToSendLabel')} />} value={f.values.amountToSend?.toString()}
                        onChangeText={f.handleChange('amountToSend')} onBlur={f.handleBlur('amountToSend')} />
                    <ErrorMessage component={ErrorText} name="amountToSend" />
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10}}>
                        <OrangeButton onPress={p.onDismiss}>{t('close_buttonCaption')}</OrangeButton>
                        <OrangeButton loading={sending} testID={ `${p.testID}:ConfirmButton` } onPress={() => {
                            f.handleSubmit()
                        }}>{t('sendTokensButtonCaption')}</OrangeButton>
                    </View>
                </View>}
            </Formik>
        </Modal>
    </Portal>
}

export default SendTokensDialog