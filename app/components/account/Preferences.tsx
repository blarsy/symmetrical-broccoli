import React, { useContext } from "react"
import LoadedZone from "../LoadedZone"
import { gql, useMutation, useQuery } from "@apollo/client"
import { AppContext } from "../AppContextProvider"
import { t } from "@/i18n"
import { DimensionValue, FlexAlignType, View } from "react-native"
import { CheckboxGroup, OrangeBackedErrorText, WhiteButton } from "../layout/lib"
import { ErrorMessage, Formik } from "formik"
import * as yup from 'yup'
import OperationFeedback from "../OperationFeedback"
import { RouteProps, aboveMdWidth, adaptToWidth, mdScreenWidth } from "@/lib/utils"
import { ScrollView } from "react-native-gesture-handler"
import { RadioButton, Text } from "react-native-paper"

export const GET_PREFERENCES = gql`query Preferences {
    me {
      id
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

export const PrefSelector = ({ value, onChange, title }: PrefSelectorProps) => <View style={{ flexDirection: 'column', padding: 10 }}>
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
    { !!value && <View>
        {[1, 3, 7, 30].map((v, idx) => <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 10 }}>
            <RadioButton
                value={v.toLocaleString()}
                status={ value === v ? "checked" : "unchecked" }
                onPress={() => onChange(v)}
                color="#fff"
            />
            <Text variant="bodyMedium" style={{ color: '#fff' }}>{`${t('maxEvery')} ${v.toLocaleString()} ${v === 1 ? t('day'): t('days')}`}</Text>
        </View>)}
    </View>}
</View>

export default ({ route, navigation }: RouteProps) => {
    const appContext = useContext(AppContext)
    const { data, loading, error } = useQuery(GET_PREFERENCES, { variables: { id: appContext.account?.id } })
    const [update, { data: updateData, loading: updating, error: updateError, reset }] = useMutation(UPDATE_ACCOUNT_BROADCAST_PREFS)

    let pref1: any, pref2: any, pref3: any
    if(data) {
        pref1 = data.me.broadcastPrefsByAccountId.nodes.find((broadcastPref: any) => broadcastPref.eventType === 1)
        pref2 = data.me.broadcastPrefsByAccountId.nodes.find((broadcastPref: any) => broadcastPref.eventType === 2)
        pref3 = data.me.broadcastPrefsByAccountId.nodes.find((broadcastPref: any) => broadcastPref.eventType === 3)
    }

    return <View style={{ flex: 1, flexDirection: 'column', backgroundColor: 'transparent', alignItems: adaptToWidth<FlexAlignType>('stretch', 'center', 'center'), paddingBottom: 10 }}>
        <LoadedZone loading={loading} error={error} loadIndicatorColor="#fff" containerStyle={{ paddingTop: 10, flex: 1, 
            width: adaptToWidth<DimensionValue>('auto', mdScreenWidth, mdScreenWidth) }}>
            <Formik initialValues={{ chatMessageDaysSummary: (pref1 && pref1.daysBetweenSummaries != -1) ? pref1.daysBetweenSummaries: undefined, 
                    newResourcesDaysSummary: (pref2 && pref2.daysBetweenSummaries != -1) ? pref2.daysBetweenSummaries : undefined,
                    unreadNotificationsDaysSummary: (pref3 && pref3.daysBetweenSummaries != -1) ? pref3.daysBetweenSummaries : undefined
                 }} validationSchema={
                yup.object().shape({
                    chatMessageDaysSummary: yup.number().nullable().min(1, t('min_1_day_message')).max(30, t('max_30_days_message')),
                    newResourcesDaysSummary: yup.number().nullable().min(1, t('min_1_day_message')).max(30, t('max_30_days_message')),
                    unreadNotificationsDaysSummary: yup.number().nullable().min(1, t('min_1_day_message')).max(30, t('max_30_days_message'))
                })
            } onSubmit={values => {
                update({ variables: { prefs: [
                    { eventType: 1, daysBetweenSummaries: values.chatMessageDaysSummary || -1 },
                    { eventType: 2, daysBetweenSummaries: values.newResourcesDaysSummary || -1 },
                    { eventType: 3, daysBetweenSummaries: values.unreadNotificationsDaysSummary || -1 },
                ] } })
            }}>
                {({handleBlur, setFieldValue, submitForm, values }) => <>
                    <Text variant="headlineLarge" style={{ flexShrink: 0, color: '#fff', textAlign: 'center', paddingBottom: 20 }}>{t('notifications_settings_title')}</Text>
                    <ScrollView>
                        <PrefSelector title={t('chatMessageNotificationsTitle')} onChange={numberOfDays => {
                            setFieldValue('chatMessageDaysSummary', numberOfDays)
                        } } handleBlur={handleBlur} value={ values.chatMessageDaysSummary } fieldName="chatMessageDaysSummary" />
                        { values.chatMessageDaysSummary && <ErrorMessage component={OrangeBackedErrorText} name="chatMessageDaysSummary" /> }
                        <PrefSelector title={t('newResourceNotificationsTitle')} onChange={numberOfDays => {
                            setFieldValue('newResourcesDaysSummary', numberOfDays)
                        } } handleBlur={handleBlur} value={ values.newResourcesDaysSummary } fieldName="newResourcesDaysSummary" />
                        { values.newResourcesDaysSummary && <ErrorMessage component={OrangeBackedErrorText} name="newResourcesDaysSummary" /> }
                        <PrefSelector title={t('newNotificationTitle')} onChange={numberOfDays => {
                            setFieldValue('unreadNotificationsDaysSummary', numberOfDays)
                        } } handleBlur={handleBlur} value={ values.unreadNotificationsDaysSummary } fieldName="unreadNotificationsDaysSummary" />
                        { values.unreadNotificationsDaysSummary && <ErrorMessage component={OrangeBackedErrorText} name="unreadNotificationsDaysSummary" /> }
                    </ScrollView>
                    <WhiteButton disabled={loading} style={{ marginTop: 20, width: aboveMdWidth() ? '60%' : '80%', alignSelf: 'center' }} onPress={e => submitForm()} loading={updating}>
                        {t('save_label')}
                    </WhiteButton>
                    <OperationFeedback testID="prefsFeedback" error={updateError} success={!!updateData} onDismissError={reset} onDismissSuccess={reset} />
                </>}
            </Formik>
        </LoadedZone>
    </View>
}