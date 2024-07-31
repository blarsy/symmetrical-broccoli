import { ErrorMessage, FormikErrors, FormikProps } from "formik"
import { t } from "i18next"
import React, { useContext, useEffect, useState } from "react"
import { TransparentTextInput, ErrorText, DateTimePickerField, OrangeButton, CheckboxGroup, StyledLabel } from "../layout/lib"
import PicturesField from "./PicturesField"
import { Category, Location, Resource } from "@/lib/schema"
import { EditResourceContext } from "../resources/EditResourceContextProvider"
import Icons from "@expo/vector-icons/FontAwesome"
import CategoriesSelect from "./CategoriesSelect"
import { aboveMdWidth } from "@/lib/utils"
import { View } from "react-native"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../AppContextProvider"
import LocationEdit from "../account/LocationEdit"
import { ActivityIndicator, Text } from "react-native-paper"
import { gql, useLazyQuery } from "@apollo/client"
import { fromData, initial, fromError } from "@/lib/DataLoadState"
import { parseLocationFromGraph } from "../account/PublicInfo"

interface Props {
    formikState: FormikProps<Resource>
    processing: boolean
}

const Hr = () => <View style={{ backgroundColor: '#343434', height: 1, transform: 'scaleY(0.5)' }}></View>

interface AddressFieldProps {
    values: Resource
    setFieldValue: (field: string, value: any, shouldValidate?: boolean | undefined) => Promise<void | FormikErrors<Resource>>
}

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

const AddressField = ({values, setFieldValue }:AddressFieldProps) => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const [getLocation] = useLazyQuery(ACCOUNT_LOCATION)
    const [actualLocation, setActualLocation] = useState(initial<Location | null>(!values.specificLocation && !!appContext.account, null))

    useEffect(() => {
        const loadLocation = async () => {
            try {
                const res = await getLocation({ variables: { id: appContext.account!.id } })
                const defaultLocation = parseLocationFromGraph(res.data.accountById.locationByLocationId)
                setActualLocation(fromData(defaultLocation))
                setFieldValue('specificLocation', defaultLocation)
            } catch(e) {
                appDispatch({ type: AppReducerActionType.DisplayNotification,  payload: { error: e }})
                setActualLocation(fromError(e, t('requestError')))
            }
        }
        if(!values.specificLocation && !!appContext.account) {
            loadLocation()
        } else {
            setActualLocation(fromData(values.specificLocation || null))
        }
    }, [])

    return <>
        <Text variant="labelSmall" style={{ marginLeft: 16, marginTop: 5 }}>{t('resource_location_label')}</Text>
        { actualLocation.loading ? 
            <ActivityIndicator style={{ paddingVertical: 5 }} /> :
            <LocationEdit style={{ marginLeft: 16 }} location={actualLocation.data || undefined} 
                onDeleteRequested={() => {
                    setFieldValue('specificLocation', null)
                    setActualLocation(fromData(null))
                }}
                onLocationChanged={newLocation => {
                    setFieldValue('specificLocation', newLocation)
                    setActualLocation(fromData(newLocation))
                } } 
                orangeBackground={false}/>
        }
    </>
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
        <ErrorMessage component={ErrorText} name="isProduct" />
        <Hr />
        <DateTimePickerField textColor="#000" value={values.expiration} onChange={async d => {
            await setFieldValue('expiration', d)
            setTouched({ expiration: true })
        }} label={t('expiration_label') + ' *'} />
        <ErrorMessage component={ErrorText} name="expiration" />
        <Hr />
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
        <AddressField setFieldValue={setFieldValue} values={values} />
        <Hr />
        <OrangeButton style={{ marginTop: 20, width: aboveMdWidth() ? '60%' : '80%', alignSelf: 'center' }} icon={props => <Icons {...props} name="pencil-square" />} onPress={() => handleSubmit()} 
            loading={processing}>
            {(editResourceContext.state.editedResource.id) ? t('save_label') : t('create_label')}
        </OrangeButton>
    </>
}

export default EditResourceFields