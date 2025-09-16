import { initial, beginOperation, fromData, fromError } from "@/lib/DataLoadState"
import { ErrorMessage, Formik } from "formik"
import { t } from "i18next"
import React, { useContext, useEffect, useState } from "react"
import * as yup from 'yup'
import { RouteProps } from "@/lib/utils"
import { EditResourceContext } from "../resources/EditResourceContextProvider"
import { ScrollView, View } from "react-native"
import { ActivityIndicator, Portal } from "react-native-paper"
import OperationFeedback from "../OperationFeedback"
import { Category, Resource } from "@/lib/schema"
import { SearchFilterContext } from "../SearchFilterContextProvider"
import { AppAlertDispatchContext, AppAlertReducerActionType, AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import useProfileAddress from "@/lib/useProfileAddress"
import { CheckboxGroup, DateTimePickerField, ErrorText, Hr, InfoIcon, OptionSelect, OrangeButton, StyledLabel, SubmitButton, TransparentTextInput } from "../layout/lib"
import LocationEdit from "../account/LocationEdit"
import PicturesField from "./PicturesField"
import Icons from "@expo/vector-icons/FontAwesome"
import CategoriesSelect from "./CategoriesSelect"
import { lightPrimaryColor, primaryColor } from "../layout/constants"
import useActiveCampaign from "@/lib/useActiveCampaign"
import { IMAGE_BORDER_RADIUS } from "@/lib/images"
import CampaignExplanationDialog from "../account/CampaignExplanationDialog"
import BareIconButton from "../layout/BareIconButton"


export default ({ route, navigation }:RouteProps) => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const appAlertDispatch = useContext(AppAlertDispatchContext)
    const editResourceContext = useContext(EditResourceContext)
    const searchFilterContext = useContext(SearchFilterContext)
    const [saveResourceState, setSaveResourcestate] = useState(initial(false, false))
    const { ensureConnected } = useUserConnectionFunctions()
    const { loading: loadingAddress, data: defaultLocation } = useProfileAddress()
    const { activeCampaign } = useActiveCampaign()
    const [explainingCampaign, setExplainingCampaign] = useState(false)

    const createResource = async (values: Resource) => {
        setSaveResourcestate(beginOperation())
        try {
            if(values.price != null) values.price = Number(values.price)

            await editResourceContext.actions.save(values)
            setSaveResourcestate(fromData(true))
            searchFilterContext.actions.requery(appContext.categories.data!)
            
            appDispatch({type: AppReducerActionType.ResourceUpdated, payload: undefined })

            if(navigation.canGoBack()) navigation.goBack()
        } catch(e: any) {
            setSaveResourcestate(fromError(e))
            appAlertDispatch({ type: AppAlertReducerActionType.DisplayNotification, payload: { error: e } })
        }
    }

    useEffect(() => {
        if(route.params?.isNew) {
            console.log('params', route.params)
            editResourceContext.actions.reset(defaultLocation || undefined, route.params.campaignId)
        }
    },  [defaultLocation])

    return <View style={{ flex: 1, backgroundColor: '#fff' }}>
        { loadingAddress ? <ActivityIndicator color={primaryColor}/> :

        <Formik enableReinitialize initialValues={editResourceContext.state.editedResource} validationSchema={yup.object().shape({
            title: yup.string().max(30).required(t('field_required')),
            description: yup.string(),
            expiration: yup.date().nullable().min(new Date(), t('date_mustBeFuture')),
            price: yup.number().nullable().integer(t('mustBeAnInteger')).min(1, t('mustBeAValidNumber')),
            categories: yup.array().min(1, t('field_required')),
            isProduct: yup.bool().test('natureIsPresent', t('nature_required'), (val, ctx) => {
                return val || ctx.parent.isService
            }),
            canBeGifted: yup.bool().test('exchangeTypeIsPresent', t('exchangeType_required'), (val, ctx) => {
                return val || ctx.parent.canBeExchanged
            }),
            canBeTakenAway: yup.bool().test('transportIsPresent', t('transport_required'), (val, ctx) => {
                return !ctx.parent.isProduct || (val || ctx.parent.canBeDelivered)
            }),
            specificLocation: yup.object().nullable().test('addressRequiredWhenResourceOnSite', t('addressRequiredWhenResourceOnSite'), (val, ctx) => {
                return !ctx.parent.canBeTakenAway || (ctx.parent.canBeTakenAway && val)
            })
        })} onSubmit={async (values) => {
            ensureConnected('connect_to_create_ressource', 'resource_is_free', () => {
                createResource(values)
            })
        }}>
        {formikState => {
            const { handleChange, handleBlur, values, setFieldValue, setTouched, handleSubmit } = formikState
            const editResourceContext = useContext(EditResourceContext)

            return <View style={{ flex: 1 }}>
                <ScrollView style={{ margin: 10, flex: 1 }}>
                    <PicturesField images={values.images} 
                        onImageSelected={async img => {
                            try {
                                await editResourceContext.actions.addImage(img, values)
                                
                            } catch(e) {
                                appAlertDispatch({ type: AppAlertReducerActionType.DisplayNotification, payload: { error: e as Error } })
                            }
                        }}
                        onImageDeleteRequested={img => {
                            editResourceContext.actions.setResource({ ...editResourceContext.state.editedResource, ...values })
                            return editResourceContext.actions.deleteImage(img, values)
                        }} />
                    <TransparentTextInput testID="title" label={<StyledLabel isMandatory label={t('title_label')} />} value={values.title}
                        onChangeText={handleChange('title')} onBlur={handleBlur('title')} />
                    <ErrorMessage component={ErrorText} name="title" />
                    { activeCampaign.data && <View style={{ backgroundColor: lightPrimaryColor, borderRadius: IMAGE_BORDER_RADIUS, padding: 6, flexDirection: 'row', alignItems: 'center' }}>
                        <OptionSelect title={`${t('resourceConformsToCampaign')} '${activeCampaign.data.name}'`} value={!!editResourceContext.state.campaignToJoin} onChange={() => {
                            editResourceContext.actions.setCampaignToJoin(editResourceContext.state.campaignToJoin ? undefined : activeCampaign.data!.id)
                        }} />
                        <BareIconButton color="#000" Image="help" size={20} onPress={() => setExplainingCampaign(true)} />
                    </View> }
                    <TransparentTextInput testID="description" label={<StyledLabel label={t('description_label')} />} value={values.description}
                        onChangeText={handleChange('description')} onBlur={handleBlur('description')} multiline={true} />
                    <ErrorMessage component={ErrorText} name="description" />
                    <CheckboxGroup testID="nature" isMandatory title={t('nature_label')} onChanged={val => {
                        setFieldValue('isProduct', val.isProduct)
                        setTouched({ isProduct: true })
                        setFieldValue('isService', val.isService)
                        setTouched({ isService: true })
                    }} values={{ isProduct: values.isProduct, isService: values.isService }} options={{
                        isProduct: t('isProduct_label'), 
                        isService: t('isService_label')
                    }} />
                    <ErrorMessage component={ErrorText} name="isProduct" />
                    <Hr />
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TransparentTextInput style={{ flex: 1 }} testID="price" label={<StyledLabel label={t('Label')} />} value={values.price?.toString()}
                            onChangeText={handleChange('price')} onBlur={handleBlur('price')} />
                        <InfoIcon text={t('Tooltip')} />
                    </View>
                    <ErrorMessage component={ErrorText} name="price" />
                    <DateTimePickerField testID="expiration" textColor="#000" value={values.expiration} onChange={async d => {
                        await setFieldValue('expiration', d)
                        setTouched({ expiration: true })
                    }} label={t('expiration_label')} />
                    <ErrorMessage component={ErrorText} name="expiration" />
                    <Hr />
                    <CategoriesSelect testID="categories" inline isMandatory label={t('resourceCategories_label')} value={values.categories} onChange={(categories: Category[]) => {
                        setFieldValue('categories', categories)
                    }} />
                    <ErrorMessage component={ErrorText} name="categories" />
                    <Hr/>
                    <CheckboxGroup testID="exchangeType" isMandatory title={t('type_label')} onChanged={val => {
                        setFieldValue('canBeGifted', val.canBeGifted)
                        setTouched({ canBeGifted: true })
                        setFieldValue('canBeExchanged', val.canBeExchanged)
                        setTouched({ canBeExchanged: true })
                    }} values={{ canBeGifted: values.canBeGifted, canBeExchanged: values.canBeExchanged }} options={{
                        canBeGifted: t('canBeGifted_label'), 
                        canBeExchanged: t('canBeExchanged_label')
                    }} />
                    <ErrorMessage component={ErrorText} name="canBeGifted" />
                    <Hr />
                    <CheckboxGroup testID="transport" isMandatory title={t('transport_label')} onChanged={val => {
                        setFieldValue('canBeTakenAway', val.canBeTakenAway)
                        setTouched({ canBeTakenAway: true })
                        setFieldValue('canBeDelivered', val.canBeDelivered)
                        setTouched({ canBeDelivered: true })
                    }} values={{ canBeTakenAway: values.canBeTakenAway, canBeDelivered: values.canBeDelivered }} options={{
                        canBeTakenAway: t(formikState.values.isProduct ? 'canBeTakenAway_label': 'onSite'), 
                        canBeDelivered: t(formikState.values.isProduct ? 'canBeDelivered_label': 'placeToBeAgreed')
                    }} />
                    <ErrorMessage component={ErrorText} name="canBeTakenAway" />
                    <Hr />
                    <LocationEdit isMandatory={values.canBeTakenAway} testID="resourceAddress" style={{ marginLeft: 16 }} location={values.specificLocation} 
                        onDeleteRequested={() => {
                            setFieldValue('specificLocation', null)
                        }}
                        onLocationChanged={newLocation => {
                            setFieldValue('specificLocation', newLocation)
                        }}
                        orangeBackground={false}/>
                    <ErrorMessage component={ErrorText} name="specificLocation" />
                    <Portal>
                        <OperationFeedback testID="resourceEditionFeedback" error={saveResourceState.error}
                            onDismissError={() => setSaveResourcestate(initial(false, false))}
                            success={saveResourceState.data}
                            onDismissSuccess={() => {
                                editResourceContext.actions.reset(defaultLocation || undefined)
                                setSaveResourcestate(initial(false, false))
                            }} />
                    </Portal>
                </ScrollView>
                <Hr />
                <SubmitButton testID="submitButton"
                    handleSubmit={handleSubmit} icon={props => <Icons {...props} name="pencil-square" />} 
                    onPress={() => handleSubmit()} 
                    loading={saveResourceState.loading} Component={OrangeButton} ErrorTextComponent={ErrorText} 
                    isValid={formikState.isValid} submitCount={formikState.submitCount} 
                    updating={saveResourceState.loading}>
                    {(editResourceContext.state.editedResource.id) ? t('save_label') : t('create_label')} 
                </SubmitButton>
                <CampaignExplanationDialog onDismiss={() =>{
                    setExplainingCampaign(false)
                }} campaign={explainingCampaign ? activeCampaign.data! : undefined} />
            </View>
        }}
        </Formik> }
    </View>
}