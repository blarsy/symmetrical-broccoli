import { initial, beginOperation, fromData, fromError } from "@/lib/DataLoadState"
import { Formik } from "formik"
import { t } from "i18next"
import React, { useContext, useEffect, useState } from "react"
import * as yup from 'yup'
import { RouteProps } from "@/lib/utils"
import { EditResourceContext } from "../resources/EditResourceContextProvider"
import EditResourceFields from "./EditResourceFields"
import { ScrollView } from "react-native"
import { ActivityIndicator, Portal } from "react-native-paper"
import { ErrorSnackbar } from "../OperationFeedback"
import { Resource, parseLocationFromGraph } from "@/lib/schema"
import { SearchFilterContext } from "../SearchFilterContextProvider"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import { gql, useLazyQuery } from "@apollo/client"

export const ACCOUNT_LOCATION = gql`query AccountLocation($id: Int!) {
    accountById(id: $id) {
      locationByLocationId {
        address
        latitude
        longitude
        id
      }
    }
}`

export default ({ route, navigation }:RouteProps) => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const editResourceContext = useContext(EditResourceContext)
    const searchFilterContext = useContext(SearchFilterContext)
    const [saveResourceState, setSaveResourcestate] = useState(initial<null>(false, null))
    const { ensureConnected } = useUserConnectionFunctions()
    const [getLocation] = useLazyQuery(ACCOUNT_LOCATION)
    const [loadingAddress, setLoadingAddress] = useState(true)

    useEffect(() => {
        const loadLocationAndReset = async () => {
            try {
                const res = await getLocation({ variables: { id: appContext.account!.id }, fetchPolicy: "network-only" })
                const defaultLocation = parseLocationFromGraph(res.data.accountById.locationByLocationId)
                editResourceContext.actions.reset(defaultLocation || undefined)
            } catch(e) {
                appDispatch({ type: AppReducerActionType.DisplayNotification,  payload: { error: e }})
            } finally {
                setLoadingAddress(false)
            }
        }
        if(route.params && route.params.isNew){
            loadLocationAndReset()
        } else {
            setLoadingAddress(false)
        }
    }, [])

    const createResource = async (values: Resource) => {
        setSaveResourcestate(beginOperation())
        try {
            await editResourceContext.actions.save(values)
            setSaveResourcestate(fromData(null))
            searchFilterContext.actions.requery(appContext.categories.data!)
            navigation.goBack()
        } catch(e: any) {
            setSaveResourcestate(fromError(e, t('requestError')))
            appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: e } })
        }
    }

    return <ScrollView style={{ backgroundColor: '#fff' }}>
        { loadingAddress ? <ActivityIndicator /> :
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
            ensureConnected('connect_to_create_ressource', 'resource_is_free', () => {
                createResource(values)
            })
        }}>
        {formikState => {
            return <ScrollView style={{ margin: 10 }}>
                    <EditResourceFields formikState={formikState} processing={saveResourceState.loading} />
                <Portal>
                    <ErrorSnackbar error={saveResourceState.error} message={saveResourceState.error && t('requestError')} onDismissError={() => setSaveResourcestate(initial<null>(false, null))} />
                </Portal>
            </ScrollView>
        }}
        </Formik> }
    </ScrollView>
}