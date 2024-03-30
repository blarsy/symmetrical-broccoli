import { initial, beginOperation, fromData, fromError } from "@/lib/DataLoadState"
import { Formik } from "formik"
import { t } from "i18next"
import React, { useContext, useEffect, useState } from "react"
import { AppContext } from "../AppContextProvider"
import * as yup from 'yup'
import { RouteProps } from "@/lib/utils"
import { EditResourceContext } from "../EditResourceContextProvider"
import EditResourceFields from "./EditResourceFields"
import { ScrollView } from "react-native"
import { Portal } from "react-native-paper"
import { ErrorSnackbar } from "../OperationFeedback"
import ConnectionDialog from "../ConnectionDialog"
import { AccountInfo, Resource } from "@/lib/schema"

interface DialogProps {
    onDone: (token: string, account: AccountInfo) => Promise<void>
    visible: boolean
    onCloseRequested: () => void
}

const Dialog = ({ onDone, visible, onCloseRequested}: DialogProps) => 
    <ConnectionDialog visible={visible} infoTextI18n="connect_to_create_ressource" 
        infoSubtextI18n="resource_is_free" onDone={onDone} onCloseRequested={onCloseRequested}/>


export default ({ route, navigation }:RouteProps) => {
    const appContext = useContext(AppContext)
    const editResourceContext = useContext(EditResourceContext)
    const [saveResourceState, setSaveResourcestate] = useState(initial<null>(false, null))
    const [connecting, setConnecting] = useState(false)

    useEffect(() => {
        if(route.params && route.params.isNew){
            editResourceContext.actions.reset()
        }
    }, [])

    const createResource = async (values: Resource, token?: string) => {
        setSaveResourcestate(beginOperation())
        try {
            await editResourceContext.actions.save(values, token)
            setSaveResourcestate(fromData(null))

            navigation.goBack()
        } catch(e: any) {
            setSaveResourcestate(fromError(e, t('requestError')))
            appContext.actions.setMessage(e)
        }
    }

    return <ScrollView style={{ backgroundColor: '#fff' }}>
        <Formik enableReinitialize initialValues={editResourceContext.state.editedResource} validationSchema={yup.object().shape({
            title: yup.string().max(30).required(t('field_required')),
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
                return !ctx.parent.isProduct || (val || ctx.parent.canBeDelivered)
            })
        })} onSubmit={async (values) => {
            if(!appContext.state.account) {
                setConnecting(true)
                return 
            }

            createResource(values)
        }}>
        {formikState => {
            return <ScrollView style={{ margin: 10 }}>
                <EditResourceFields formikState={formikState} processing={saveResourceState.loading} />
                <Portal>
                    <ErrorSnackbar error={saveResourceState.error} message={saveResourceState.error && t('requestError')} onDismissError={() => setSaveResourcestate(initial<null>(false, null))} />
                </Portal>
                <Dialog visible={connecting} onDone={async (token) => {
                    setConnecting(false)
                    createResource(formikState.values, token)
                }} onCloseRequested={() => {
                    setConnecting(false)
                }}/>
            </ScrollView>
        }}
        </Formik>
    </ScrollView>
}