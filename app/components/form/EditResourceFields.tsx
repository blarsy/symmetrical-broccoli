import { ErrorMessage, FormikProps } from "formik"
import { t } from "i18next"
import React, { useContext, useEffect } from "react"
import { TransparentTextInput, ErrorText, DateTimePickerField, OrangeButton, CheckboxGroup, StyledLabel, SubmitButton, Hr } from "../layout/lib"
import PicturesField from "./PicturesField"
import { Category, Resource } from "@/lib/schema"
import { EditResourceContext } from "../resources/EditResourceContextProvider"
import Icons from "@expo/vector-icons/FontAwesome"
import CategoriesSelect from "./CategoriesSelect"
import { AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import LocationEdit from "../account/LocationEdit"

interface Props {
    formikState: FormikProps<Resource>
    processing: boolean
}

const EditResourceFields = ({formikState, processing}: Props) => {
    const appDispatch = useContext(AppDispatchContext)
    const { handleChange, handleBlur, values, setFieldValue, setTouched, resetForm, handleSubmit } = formikState
    const editResourceContext = useContext(EditResourceContext)

    useEffect(() => {
        editResourceContext.actions.setChangeCallback(() => {
            resetForm()
        })
        return () => editResourceContext.actions.removeChangeCallback()
    }, [])

    return <>
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
        <DateTimePickerField textColor="#000" value={values.expiration} onChange={async d => {
            await setFieldValue('expiration', d)
            setTouched({ expiration: true })
        }} label={t('expiration_label') + ' *'} />
        <ErrorMessage component={ErrorText} name="expiration" />
        <Hr />
        <CategoriesSelect inline label={t('resourceCategories_label') + ' *'} value={values.categories} onChange={(categories: Category[]) => {
            setFieldValue('categories', categories)
        }} />
        <ErrorMessage component={ErrorText} name="categories" />
        <Hr/>
        <CheckboxGroup title={t('type_label') + ' *'} onChanged={val => {
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
            <CheckboxGroup title={t('transport_label') + ' *'} onChanged={val => {
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
        <SubmitButton
            handleSubmit={handleSubmit} icon={props => <Icons {...props} name="pencil-square" />} 
            onPress={() => handleSubmit()} 
            loading={processing} Component={OrangeButton} ErrorTextComponent={ErrorText} isValid={formikState.isValid}
            submitCount={formikState.submitCount} updating={processing}>
            {(editResourceContext.state.editedResource.id) ? t('save_label') : t('create_label')} 
        </SubmitButton>
    </>
}

export default EditResourceFields