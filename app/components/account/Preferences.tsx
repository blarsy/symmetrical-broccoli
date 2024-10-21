import React, { useContext, useEffect } from "react"
import LoadedZone from "../LoadedZone"
import { gql, useMutation, useQuery } from "@apollo/client"
import { AppContext } from "../AppContextProvider"
import { t } from "@/i18n"
import { DimensionValue, FlexAlignType, View } from "react-native"
import { CheckboxGroup, OrangeBackedErrorText, OrangeTextInput, StyledLabel, WhiteButton } from "../layout/lib"
import { ErrorMessage, Formik } from "formik"
import * as yup from 'yup'
import OperationFeedback from "../OperationFeedback"
import { RouteProps, aboveMdWidth, adaptToWidth, mdScreenWidth } from "@/lib/utils"
import { ScrollView } from "react-native-gesture-handler"
import { Text } from "react-native-paper"

export const GET_PREFERENCES = gql`query Preferences($id: Int!) {
    accountById(id: $id) {
      broadcastPrefsByAccountId {
        nodes {
          eventType
          id
          daysBetweenSummaries
        }
      }
    }
}`

const UPDATE_ACCOUNT_BROADCAST_PREFS = gql`mutation UpdateAccountBroadcastPrefs($prefs: [BroadcastPrefTypeInput]) {
    updateAccountBroadcastPrefs(input: {prefs: $prefs}) {
      integer
    }
  }`

interface PrefSelectorProps {
    value: number | undefined
    onChange: (numberOfDays: number | undefined) => void
    title: string
    handleBlur: any
    fieldName: string
}

export const PrefSelector = ({ value, onChange, title, handleBlur, fieldName }: PrefSelectorProps) => <View style={{ flexDirection: 'column', padding: 10 }}>
    <CheckboxGroup options={{
            realtime: t('option_realtime'),
            regularSummary: t('option_regularSummary')
        }} title={title} values={{ realtime: !value, regularSummary: !!value }} 
        onChanged={(newVal, oldval) => {
            if(!oldval.realtime){ 
                onChange(undefined)
             } else {
                onChange(1)
             }
        }} color="#fff" selectedColor="#fff" />
    { !!value && <OrangeTextInput style={{ flex: 1 }} label={<StyledLabel label={t('number_of_days_between_summaries')} color="#fff"/>} textContentType="name" value={value.toLocaleString()}
        onChangeText={e => onChange(new Number(e).valueOf())} onBlur={handleBlur(fieldName)} />}
</View>

export default ({ route, navigation }: RouteProps) => {
    const appContext = useContext(AppContext)
    const { data, loading, error } = useQuery(GET_PREFERENCES, { variables: { id: appContext.account?.id } })
    const [update, { data: updateData, loading: updating, error: updateError, reset }] = useMutation(UPDATE_ACCOUNT_BROADCAST_PREFS)

    let pref1: any, pref2: any
    if(data) {
        pref1 = data.accountById.broadcastPrefsByAccountId.nodes.find((broadcastPref: any) => broadcastPref.eventType === 1)
        pref2 = data.accountById.broadcastPrefsByAccountId.nodes.find((broadcastPref: any) => broadcastPref.eventType === 2)
    }

    return <ScrollView style={{ flex: 1, flexDirection: 'column', backgroundColor: 'transparent' }} contentContainerStyle={{ alignItems: adaptToWidth<FlexAlignType>('stretch', 'center', 'center') }}>
        <LoadedZone loading={loading} error={error} loadIndicatorColor="#fff" containerStyle={{ paddingTop: 10, flex: 1, 
            width: adaptToWidth<DimensionValue>('auto', mdScreenWidth, mdScreenWidth) }}>
            <Formik initialValues={{ chatMessageDaysSummary: (pref1 && pref1.daysBetweenSummaries != -1) ? pref1.daysBetweenSummaries: undefined, 
                    newResourcesDaysSummary: (pref2 && pref2.daysBetweenSummaries != -1) ? pref2.daysBetweenSummaries : undefined }} validationSchema={
                yup.object().shape({
                    chatMessageDaysSummary: yup.number().nullable().min(1, t('min_1_day_message')).max(30, t('max_30_days_message')),
                    newResourcesDaysSummary: yup.number().nullable().min(1, t('min_1_day_message')).max(30, t('max_30_days_message'))
                })
            } onSubmit={values => {
                update({ variables: { prefs: [
                    { eventType: 1, daysBetweenSummaries: values.chatMessageDaysSummary || -1 },
                    { eventType: 2, daysBetweenSummaries: values.newResourcesDaysSummary || -1 }
                ] } })
            }}>
                {({handleBlur, setFieldValue, submitForm, values, dirty }) => {
                    return <>
                        <Text variant="headlineMedium" style={{ flex: 1, color: '#fff', textAlign: 'center', paddingBottom: 10 }}>{t('notifications_settings_title')}</Text>
                        <PrefSelector title={t('chat_broadcast_prefs_title')} onChange={numberOfDays => {
                            setFieldValue('chatMessageDaysSummary', numberOfDays)
                        } } handleBlur={handleBlur} value={ values.chatMessageDaysSummary } fieldName="chatMessageDaysSummary" />
                        { values.chatMessageDaysSummary && <ErrorMessage component={OrangeBackedErrorText} name="chatMessageDaysSummary" /> }
                        <PrefSelector title={t('newResources_broadcast_prefs_title')} onChange={numberOfDays => {
                            setFieldValue('newResourcesDaysSummary', numberOfDays)
                        } } handleBlur={handleBlur} value={ values.newResourcesDaysSummary } fieldName="newResourcesDaysSummary" />
                        { values.newResourcesDaysSummary && <ErrorMessage component={OrangeBackedErrorText} name="newResourcesDaysSummary" /> }
                        <WhiteButton disabled={loading} style={{ marginTop: 20, width: aboveMdWidth() ? '60%' : '80%', alignSelf: 'center' }} onPress={e => submitForm()} loading={updating}>
                            {t('save_label')}
                        </WhiteButton>
                        <OperationFeedback testID="prefsFeedback" error={updateError} success={!!updateData} onDismissError={reset} onDismissSuccess={reset} />
                    </>
                }}
            </Formik>
        </LoadedZone>
    </ScrollView>
}