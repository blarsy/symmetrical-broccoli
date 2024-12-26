import { initial, beginOperation, fromData, fromError } from "@/lib/DataLoadState"
import { ErrorMessage, Formik } from "formik"
import { t } from "i18next"
import React, { useContext, useEffect, useState } from "react"
import * as yup from 'yup'
import { RouteProps } from "@/lib/utils"
import { EditResourceContext } from "../resources/EditResourceContextProvider"
import { ScrollView } from "react-native"
import { ActivityIndicator, Portal } from "react-native-paper"
import OperationFeedback from "../OperationFeedback"
import { Category, Resource } from "@/lib/schema"
import { SearchFilterContext } from "../SearchFilterContextProvider"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import useProfileAddress from "@/lib/useProfileAddress"
import { CheckboxGroup, DateTimePickerField, ErrorText, Hr, OrangeButton, StyledLabel, SubmitButton, TransparentTextInput } from "../layout/lib"
import LocationEdit from "../account/LocationEdit"
import PicturesField from "./PicturesField"
import Icons from "@expo/vector-icons/FontAwesome"
import CategoriesSelect from "./CategoriesSelect"
import { primaryColor } from "../layout/constants"


export default ({ route, navigation }:RouteProps) => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const editResourceContext = useContext(EditResourceContext)
    const searchFilterContext = useContext(SearchFilterContext)
    const [saveResourceState, setSaveResourcestate] = useState(initial(false, false))
    const { ensureConnected } = useUserConnectionFunctions()
    const { loading: loadingAddress, data: defaultLocation } = useProfileAddress()

    const createResource = async (values: Resource) => {
        setSaveResourcestate(beginOperation())
        try {
            const subjectiveValue = new Number(values.subjectiveValue).valueOf()
            values.subjectiveValue = isNaN(subjectiveValue) ? null : subjectiveValue

            await editResourceContext.actions.save(values)
            setSaveResourcestate(fromData(true))
            searchFilterContext.actions.requery(appContext.categories.data!)
            
            if(navigation.canGoBack()) navigation.goBack()
        } catch(e: any) {
            setSaveResourcestate(fromError(e, t('requestError')))
            appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: e } })
        }
    }

    useEffect(() => {
        if(route.params?.isNew) {
            editResourceContext.actions.reset(defaultLocation || undefined)
        }
    },  [defaultLocation])

    return <ScrollView style={{ backgroundColor: '#fff' }}>
        { loadingAddress ? <ActivityIndicator color={primaryColor}/> :
        <Formik enableReinitialize initialValues={editResourceContext.state.editedResource} validationSchema={yup.object().shape({
            title: yup.string().max(30).required(t('field_required')),
            description: yup.string(),
            expiration: yup.date().nullable().min(new Date(), t('date_mustBeFuture')),
            subjectiveValue: yup.number().nullable().integer(t('mustBeAnInteger')).min(1, t('mustBeAValidNumber')),
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
            const appDispatch = useContext(AppDispatchContext)
            const { handleChange, handleBlur, values, setFieldValue, setTouched, handleSubmit } = formikState
            const editResourceContext = useContext(EditResourceContext)

            return <ScrollView style={{ margin: 10 }}>
                <PicturesField images={values.images} 
                    onImageSelected={async img => {
                        try {
                            await editResourceContext.actions.addImage(img, values)
                        } catch(e) {
                            appDispatch({ type: AppReducerActionType.DisplayNotification, payload: { error: e as Error } })
                        }
                    }}
                    onImageDeleteRequested={img => {
                        editResourceContext.actions.setResource({ ...editResourceContext.state.editedResource, ...values })
                        return editResourceContext.actions.deleteImage(img, values)
                    }} />
                <TransparentTextInput testID="title" label={<StyledLabel label={t('title_label') + ' *'} />} value={values.title}
                    onChangeText={handleChange('title')} onBlur={handleBlur('title')} />
                <ErrorMessage component={ErrorText} name="title" />
                <TransparentTextInput testID="description" label={<StyledLabel label={t('description_label')} />} value={values.description}
                    onChangeText={handleChange('description')} onBlur={handleBlur('description')} multiline={true} />
                <ErrorMessage component={ErrorText} name="description" />
                <CheckboxGroup testID="nature" title={t('nature_label') + ' *'} onChanged={val => {
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
                <TransparentTextInput testID="subjectiveValue" label={<StyledLabel label={t('subjectiveValueLabel')} />} value={values.subjectiveValue?.toString()}
                    onChangeText={handleChange('subjectiveValue')} onBlur={handleBlur('subjectiveValue')} />
                <ErrorMessage component={ErrorText} name="subjectiveValue" />
                <DateTimePickerField testID="expiration" textColor="#000" value={values.expiration} onChange={async d => {
                    await setFieldValue('expiration', d)
                    setTouched({ expiration: true })
                }} label={t('expiration_label')} />
                <ErrorMessage component={ErrorText} name="expiration" />
                <Hr />
                <CategoriesSelect testID="categories" inline label={t('resourceCategories_label') + ' *'} value={values.categories} onChange={(categories: Category[]) => {
                    setFieldValue('categories', categories)
                }} />
                <ErrorMessage component={ErrorText} name="categories" />
                <Hr/>
                <CheckboxGroup testID="exchangeType" title={t('type_label') + ' *'} onChanged={val => {
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
                { values.isProduct && <>
                    <CheckboxGroup testID="transport" title={t('transport_label') + ' *'} onChanged={val => {
                        setFieldValue('canBeTakenAway', val.canBeTakenAway)
                        setTouched({ canBeTakenAway: true })
                        setFieldValue('canBeDelivered', val.canBeDelivered)
                        setTouched({ canBeDelivered: true })
                    }} values={{ canBeTakenAway: values.canBeTakenAway, canBeDelivered: values.canBeDelivered }} options={{
                        canBeTakenAway: t('canBeTakenAway_label'), 
                        canBeDelivered: t('canBeDelivered_label')
                    }} />
                    <ErrorMessage component={ErrorText} name="canBeTakenAway" />
                    <Hr />
                </> }
                <LocationEdit style={{ marginLeft: 16 }} location={values.specificLocation || undefined} 
                    onDeleteRequested={() => {
                        setFieldValue('specificLocation', null)
                    }}
                    onLocationChanged={newLocation => {
                        setFieldValue('specificLocation', newLocation)
                    } } 
                    orangeBackground={false}/>
                <Hr />
                <SubmitButton testID="submitButton"
                    handleSubmit={handleSubmit} icon={props => <Icons {...props} name="pencil-square" />} 
                    onPress={() => handleSubmit()} 
                    loading={saveResourceState.loading} Component={OrangeButton} ErrorTextComponent={ErrorText} isValid={formikState.isValid}
                    submitCount={formikState.submitCount} updating={saveResourceState.loading}>
                    {(editResourceContext.state.editedResource.id) ? t('save_label') : t('create_label')} 
                </SubmitButton>
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
        }}
        </Formik> }
    </ScrollView>
}