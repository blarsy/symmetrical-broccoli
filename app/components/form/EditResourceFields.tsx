import { ErrorMessage, FormikProps } from "formik"
import { t } from "i18next"
import React, { useContext, useEffect } from "react"
import { TransparentTextInput, ErrorText, DateTimePickerField, OrangeButton, CheckboxGroup, StyledLabel } from "../layout/lib"
import PicturesField from "./PicturesField"
import { Category, Resource } from "@/lib/schema"
import { EditResourceContext } from "../resources/EditResourceContextProvider"
import Icons from "@expo/vector-icons/FontAwesome"
import { AppContext } from "../AppContextProvider"
import CategoriesSelect from "./CategoriesSelect"
import { aboveMdWidth } from "@/lib/utils"
import { View } from "react-native"

interface Props {
    formikState: FormikProps<Resource>
    processing: boolean
}

const Hr = () => <View style={{ backgroundColor: '#343434', height: 1, transform: 'scaleY(0.5)' }}></View>

const EditResourceFields = ({formikState, processing}: Props) => {
    const appContext = useContext(AppContext)
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
                    appContext.actions.setMessage((e as Error).stack!)
                    appContext.actions.notify({ error: e as Error })
                }
            }}
            onImageDeleteRequested={img => {
                editResourceContext.actions.setResource({ ...editResourceContext.state.editedResource, ...values })
                return editResourceContext.actions.deleteImage(img, values)
            }} />
        <TransparentTextInput label={<StyledLabel label={t('title_label') + ' *'} />} value={values.title}
            onChangeText={handleChange('title')} onBlur={handleBlur('title')} />
        <ErrorMessage component={ErrorText} name="title" />
        <TransparentTextInput label={<StyledLabel label={t('description_label')} />} value={values.description}
            onChangeText={handleChange('description')} onBlur={handleBlur('description')} multiline={true} />
        <ErrorMessage component={ErrorText} name="description" />
        <CheckboxGroup title={t('nature_label') + ' *'} onChanged={val => {
            setFieldValue('isProduct', val.isProduct)
            setTouched({ isProduct: true })
            setFieldValue('isService', val.isService)
            setTouched({ isService: true })
        }} values={{ isProduct: values.isProduct, isService: values.isService }} options={{
            isProduct: t('isProduct_label'), 
            isService: t('isService_label')
        }} />
        <Hr />
        <ErrorMessage component={ErrorText} name="isProduct" />
        <DateTimePickerField textColor="#000" value={values.expiration} onChange={async d => {
            await setFieldValue('expiration', d)
            setTouched({ expiration: true })
        }} label={t('expiration_label') + ' *'} />
        <Hr />
        <ErrorMessage component={ErrorText} name="expiration" />
        <CategoriesSelect label={t('resourceCategories_label') + ' *'} value={values.categories} onChange={(categories: Category[]) => {
            setFieldValue('categories', categories)
        }} />
        <ErrorMessage component={ErrorText} name="categories" />
        <CheckboxGroup title={t('type_label') + ' *'} onChanged={val => {
            setFieldValue('canBeGifted', val.canBeGifted)
            setTouched({ canBeGifted: true })
            setFieldValue('canBeExchanged', val.canBeExchanged)
            setTouched({ canBeExchanged: true })
        }} values={{ canBeGifted: values.canBeGifted, canBeExchanged: values.canBeExchanged }} options={{
            canBeGifted: t('canBeGifted_label'), 
            canBeExchanged: t('canBeExchanged_label')
        }} />
        <Hr />
        <ErrorMessage component={ErrorText} name="canBeGifted" />
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
            <Hr />
            <ErrorMessage component={ErrorText} name="canBeTakenAway" />
        </> }
        <OrangeButton style={{ marginTop: 20, width: aboveMdWidth() ? '60%' : '80%', alignSelf: 'center' }} icon={props => <Icons {...props} name="pencil-square" />} onPress={() => handleSubmit()} 
            loading={processing}>
            {(editResourceContext.state.editedResource.id) ? t('save_label') : t('create_label')}
        </OrangeButton>
    </>
}

export default EditResourceFields