import { HelperText, Modal, Portal, Text } from "react-native-paper"
import { lightPrimaryColor } from "../layout/constants"
import React, { useContext } from "react"
import { t } from "@/i18n"
import { ErrorMessage, Formik } from "formik"
import * as yup from "yup"
import { ErrorText, OrangeButton, StyledLabel, TransparentTextInput } from "../layout/lib"
import { View } from "react-native"
import { gql, useMutation } from "@apollo/client"
import { Resource } from "@/lib/schema"
import OperationFeedback from "../OperationFeedback"
import { AppAlertDispatchContext, AppAlertReducerActionType, AppContext } from "../AppContextProvider"

interface Props {
    resource?: Resource
    onDismiss: () => void
    testID?: string
}

export const CREATE_BID = gql`mutation CreateBid($amountOfTokens: Int, $hoursValid: Int, $resourceId: UUID) {
  createBid(
    input: {amountOfTokens: $amountOfTokens, hoursValid: $hoursValid, resourceId: $resourceId}
  ) {
    uuid
  }
}`

const CreateBidDialog = (p: Props) => {
    const [createBid, { loading: creating, error: creationError, reset: creationReset }] = useMutation(CREATE_BID)
    const appContext = useContext(AppContext)
    const appAlertDispatchContext = useContext(AppAlertDispatchContext)
    return <Portal>
        <Modal visible={!!p.resource} onDismiss={p.onDismiss} 
            contentContainerStyle={{ padding: 20, backgroundColor: lightPrimaryColor, margin: 10, borderRadius: 15 }}
            dismissableBackButton dismissable>
            <Text variant="headlineLarge" style={{ textAlign: 'center', paddingVertical: 10, fontSize: 24 }}>{t('createBidTitle')}</Text>
            <Formik initialValues={{ amountToBid: Math.min(appContext.account!.amountOfTokens, p.resource && p.resource.price || 1), hoursValid: 12 }} validationSchema={yup.object().shape({
                amountToBid: yup.number().moreThan(0, t('mustBeNonNullPositive')).required(t('field_required')),
                hoursValid: yup.number().lessThan(49, t('mustBeMax48Hours')).moreThan(0, t('mustBeAtLeastObeHour')).required(t('field_required'))
            })} onSubmit={async values => {
                await createBid({ variables: { amountOfTokens: Number(values.amountToBid), hoursValid: values.hoursValid, resourceId: p.resource!.id } })
                appAlertDispatchContext({ type: AppAlertReducerActionType.DisplayNotification, payload: { message: t('createdBidSuccessMessage') }  })
                p.onDismiss()
            }}>
                {f => <View style={{ gap: 10 }}>
                    <TransparentTextInput testID={`${p.testID}:amountToBid`} label={<StyledLabel label={t('amountToBidLabel')} />} value={f.values.amountToBid?.toString()}
                        onChangeText={f.handleChange('amountToBid')} onBlur={f.handleBlur('amountToBid')} />
                    <ErrorMessage component={ErrorText} name="amountToBid" />
                    <Text variant="bodyMedium">{t('explainTokensForBids2')}</Text>
                    <TransparentTextInput testID={`${p.testID}:HoursValid`} label={<StyledLabel label={t('hoursValidLabel')} />} value={f.values.hoursValid?.toString()}
                        onChangeText={f.handleChange('hoursValid')} onBlur={f.handleBlur('hoursValid')} />
                    <ErrorMessage component={ErrorText} name="hoursValid" />
                    <Text variant="bodyMedium">{t('explainTokensForBids1')}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10}}>
                        <OrangeButton onPress={p.onDismiss}>{t('close_buttonCaption')}</OrangeButton>
                        <OrangeButton loading={creating} testID={ `${p.testID}:ConfirmButton` } onPress={() => {
                            f.handleSubmit()
                        }}>{t('createBidButtonCaption')}</OrangeButton>
                        <OperationFeedback error={creationError} onDismissError={creationReset} />
                    </View>
                </View>}
            </Formik>
        </Modal>
    </Portal>
}

export default CreateBidDialog