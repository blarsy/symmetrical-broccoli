import { initial, beginOperation, fromData, fromError } from "@/lib/DataLoadState"
import { Formik } from "formik"
import { t } from "i18next"
import React, { useContext, useEffect, useState } from "react"
import { AppContext } from "../AppContextProvider"
import * as yup from 'yup'
import { RouteProps } from "@/lib/utils"
import { EditResourceContext } from "../EditResourceContextProvider"
import EditResourceFields from "./EditResourceFields"
import { ScrollView, View } from "react-native"
import { Portal, Snackbar } from "react-native-paper"


export default ({ route, navigation }:RouteProps) => {
    const appContext = useContext(AppContext)
    const editResourceContext = useContext(EditResourceContext)
    const [saveResourceState, setSaveResourcestate] = useState(initial<null>(false, null))

    useEffect(() => {
        if(route.params && route.params.isNew){
            editResourceContext.actions.reset()
        }
    }, [])

    return <View style={{ backgroundColor: '#fff' }}>
        <Formik enableReinitialize initialValues={editResourceContext.state.editedResource} validationSchema={yup.object().shape({
            title: yup.string().max(50).required(t('field_required')),
            description: yup.string(),
            expiration: yup.date().required(t('field_required')),
            categories: yup.array().min(1, t('field_required')),
            isProduct: yup.bool().test('natureIsPresent', t('nature_required'), (val, ctx) => {
                return val || ctx.parent.isService
            }),
            canBeGifted: yup.bool().test('transportIsPresent', t('transport_required'), (val, ctx) => {
                return val || ctx.parent.canBeExchanged
            }),
            canBeTakenAway: yup.bool().test('exchangeTypeIsPresent', t('exchangeType_required'), (val, ctx) => {
                return val || ctx.parent.canBeDelivered
            })
        })} onSubmit={async (values) => {
            setSaveResourcestate(beginOperation())
            try {
                await editResourceContext.actions.save(appContext.state.token.data!, values)
                setSaveResourcestate(fromData(null))

                navigation.goBack()
            } catch(e: any) {
                setSaveResourcestate(fromError(e, t('requestError')))
                appContext.actions.setMessage(e)
            }
        }}>
        {formikState => {
            return <ScrollView style={{ margin: 10 }}>
                <EditResourceFields formikState={formikState} processing={saveResourceState.loading} />
                <Portal>
                    <Snackbar role="alert" visible={!!saveResourceState.error && !!saveResourceState.error.message} 
                        onDismiss={() => setSaveResourcestate(initial<null>(false, null))}>
                        {saveResourceState.error && saveResourceState.error.message}
                    </Snackbar>
                </Portal>
            </ScrollView>
        }}
        </Formik>
    </View>
}