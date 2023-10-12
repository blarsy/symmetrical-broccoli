import Images from "@/Images"
import { ErrorMessage, FormikProps } from "formik"
import { t } from "i18next"
import React, { useContext, useEffect } from "react"
import { List, IconButton, Text, Surface } from "react-native-paper"
import AppendableList from "../AppendableList"
import { TransparentTextInput, ErrorText, DateTimePickerField, OrangeButton } from "../layout/lib"
import PicturesField from "./PicturesField"
import { Condition, Resource } from "@/lib/schema"
import { EditResourceContext } from "../EditResourceContextProvider"
import Icons from "@expo/vector-icons/FontAwesome"
import { AppContext } from "../AppContextProvider"

const limitWithEllipsis = (text: string, amountChars: number) => text.length > amountChars ?`${text.substring(0, amountChars)}...` : text

interface Props {
    formikState: FormikProps<Resource>
    onConditionAddRequested: () => void
    onConditionEditRequested: (condition: Condition) => void
    processing: boolean
}

const EditResourceFields = ({formikState, onConditionAddRequested, onConditionEditRequested, processing}: Props) => {
    const appContext = useContext(AppContext)
    const { handleChange, handleBlur, values, setFieldValue, resetForm, handleSubmit } = formikState
    const editResourceContext = useContext(EditResourceContext)

    useEffect(() => {
        editResourceContext.actions.setChangeCallback(() => resetForm())
    }, [])

    return <>
        <PicturesField images={values.images} 
            onImageSelected={img => editResourceContext.actions.addImage(appContext.state.token!.data!, editResourceContext.state.resource.id, img)}
            onImageDeleteRequested={img => editResourceContext.actions.deleteImage(appContext.state.token!.data!, editResourceContext.state.resource.id, img)} />
        <TransparentTextInput label={t('title_label')} value={values.title}
            onChangeText={handleChange('title')} onBlur={handleBlur('title')} />
        <ErrorMessage component={ErrorText} name="title" />
        <TransparentTextInput label={t('description_label')} value={values.description}
            onChangeText={handleChange('description')} onBlur={handleBlur('description')} />
        <ErrorMessage component={ErrorText} name="description" />
        <DateTimePickerField textColor="#000" value={values.expiration} onChange={d =>  setFieldValue('expiration', d)} label={t('expiration_label')} />
        <ErrorMessage component={ErrorText} name="expiration" />
        <Surface style={{ marginTop: 8 }}>
            <Text style={{ fontSize: 16, marginLeft: 16, marginTop: 16 }}>{t('conditions_label')}</Text>
            <AppendableList state={values.conditions} onAddRequested={onConditionAddRequested} 
                displayItem={(item, idx) => <List.Item key={idx} title={item.title}
                    description={limitWithEllipsis(item.description, 30)}
                    onPress={() => onConditionEditRequested(item)} 
                    right={() => <IconButton icon={Images.Cross} onPress={e => {
                        e.stopPropagation()
                        editResourceContext.actions.deleteCondition(item)
                    }} />} />} />
        </Surface>
        <OrangeButton style={{ marginTop: 20 }} icon={props => <Icons {...props} name="pencil-square" />} onPress={() => handleSubmit()} 
            loading={processing}>
            {(editResourceContext.state.resource.id) ? t('save_label') : t('create_label')}
        </OrangeButton>
    </>
}

export default EditResourceFields