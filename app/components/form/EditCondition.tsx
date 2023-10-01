import { Condition } from "@/lib/schema"
import { RouteProps } from "@/lib/utils"
import { ErrorMessage, Formik } from "formik"
import React, { useContext } from "react"
import { View } from "react-native"
import { ErrorText, OrangeButton, TransparentTextInput } from "../layout/lib"
import { t } from "@/i18n"
import * as yup from 'yup'
import Icons from "@expo/vector-icons/FontAwesome"
import { EditResourceContext } from "../EditResourceContextProvider"

const EditCondition = ({ route, navigation }:RouteProps) => {
    const editResourceAppContext = useContext(EditResourceContext)
    return <Formik initialValues={route.params.condition as Condition} validationSchema={yup.object().shape({
            title: yup.string().required(t('field_required')),
            description: yup.string()
        })} onSubmit={values => {
            editResourceAppContext.actions.setCondition(values)
            navigation.goBack()
        }}>
        {({ handleChange, handleBlur, handleSubmit, values }) => <View>
            <TransparentTextInput id="title" 
                label={t('condition_title_label')} value={values.title} 
                onChange={handleChange} onBlur={handleBlur} />
            <ErrorMessage component={ErrorText} name="title" />
            <TransparentTextInput id="description" 
                label={t('condition_description_label')} value={values.description} 
                onChange={handleChange} onBlur={handleBlur} />
            <ErrorMessage component={ErrorText} name="description" />
            <OrangeButton style={{ marginTop: 20 }} onPress={() => handleSubmit()} icon={props => <Icons {...props} name="pencil-square" />}>{t('save_label')}</OrangeButton>
        </View>}
    </Formik>
} 

export default EditCondition