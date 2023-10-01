import { initial, beginOperation, fromData, fromError } from "@/lib/DataLoadState"
import { createResource, updateResource } from "@/lib/api"
import { Formik } from "formik"
import { t } from "i18next"
import React, { useContext, useState } from "react"
import { AppContext } from "../AppContextProvider"
import * as yup from 'yup'
import { RouteProps } from "@/lib/utils"
import { EditResourceContext } from "../EditResourceContextProvider"
import EditResourceFields from "./EditResourceFields"
import { View } from "react-native"
import { Portal, Snackbar } from "react-native-paper"


export default ({ route, navigation }:RouteProps) => {
    const appContext = useContext(AppContext)
    const editResourceContext = useContext(EditResourceContext)
    const [saveResourceState, setSaveResourcestate] = useState(initial<null>(false))

    return <Formik enableReinitialize initialValues={editResourceContext.state.resource} validationSchema={yup.object().shape({
        title: yup.string().max(50).required(t('field_required')),
        description: yup.string(),
        expiration: yup.date().required(t('field_required'))
     })} onSubmit={async (values) => {
        setSaveResourcestate(beginOperation())
        try {
            if(editResourceContext.state.resource.id) {
                await updateResource(appContext.state.token.data!, values)
            } else {
                await createResource(appContext.state.token.data!, values)
            }
            
            setSaveResourcestate(fromData(null))

            navigation.navigate({
                name: 'resourcesMain',
                params: {
                    hasChanged: true
                },
                merge: true
            })
        } catch(e: any) {
            setSaveResourcestate(fromError(e, t('requestError')))
            appContext.actions.setMessage(e)
        }
    }}>
    {formikState => {
        return <View style={{ padding: 10 }}>
            <EditResourceFields formikState={formikState} onConditionAddRequested={() => {
                navigation.navigate('addCondition', { condition: { title: '', description: ''}} )
            }} onConditionEditRequested={condition => {
                navigation.navigate('editCondition', { condition } )
            }} processing={saveResourceState.loading}/>
            <Portal>
                <Snackbar role="alert" visible={!!saveResourceState.error && !!saveResourceState.error.message} 
                    onDismiss={() => setSaveResourcestate(initial<null>(false))}>
                    {saveResourceState.error && saveResourceState.error.message}
                </Snackbar>
            </Portal>
        </View>
    }}
    </Formik>
}