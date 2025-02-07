import React, { useRef, useState } from "react"
import { OrangeBackedErrorText, OrangeTextInput, RightAlignedModifyButtons, StyledLabel, WhiteReadOnlyField } from "../layout/lib"
import { TextInput, View } from "react-native"
import { ErrorMessage, Formik } from "formik"
import * as yup from 'yup'
import { aboveMdWidth } from "@/lib/utils"
import { t } from "@/i18n"

interface Props {
    label: string
    textContentType: | 'none'
        | 'URL'
        | 'addressCity'
        | 'addressCityAndState'
        | 'addressState'
        | 'countryName'
        | 'creditCardNumber'
        | 'creditCardExpiration'
        | 'creditCardExpirationMonth'
        | 'creditCardExpirationYear'
        | 'creditCardSecurityCode'
        | 'creditCardType'
        | 'creditCardName'
        | 'creditCardGivenName'
        | 'creditCardMiddleName'
        | 'creditCardFamilyName'
        | 'emailAddress'
        | 'familyName'
        | 'fullStreetAddress'
        | 'givenName'
        | 'jobTitle'
        | 'location'
        | 'middleName'
        | 'name'
        | 'namePrefix'
        | 'nameSuffix'
        | 'nickname'
        | 'organizationName'
        | 'postalCode'
        | 'streetAddressLine1'
        | 'streetAddressLine2'
        | 'sublocality'
        | 'telephoneNumber'
        | 'username'
        | 'password'
        | 'newPassword'
        | 'oneTimeCode'
        | 'birthdate'
        | 'birthdateDay'
        | 'birthdateMonth'
        | 'birthdateYear'
        | undefined
    initialValue: string
    testID: string
    validationSchema: yup.Schema
    onSave: (value: string) => Promise<void>
    onDelete?: () => Promise<void>
}

const InlineFormTextInput = (p: Props) => {
    const [editing, setEditing] = useState(false)
    const textInputRef = useRef<TextInput>()

    return <Formik initialValues={{ value: p.initialValue }} 
        validationSchema={yup.object().shape({
            value: p.validationSchema
        })} onSubmit={async values => {
            await p.onSave(values.value)
            setEditing(false)
        }}>
    {({ handleChange, handleBlur, handleSubmit, values, submitCount, isValid, initialValues, setFieldValue }) => {
        const touched = initialValues.value != values.value
        
        return <View style={{ position: 'relative' }}>
            { editing ?
                <OrangeTextInput testID={`${p.testID}:Input`} label={<StyledLabel label={p.label}
                    color="#ffa38b"/>} textContentType={p.textContentType} value={values.value} onChangeText={handleChange('value')} 
                    onBlur={handleBlur('value')} style={ !editing && { borderBottomWidth: 0 } }
                    underlineStyle={ !editing ? { display: 'none' } : undefined } innerRef={textInputRef}
                    underlineColor="transparent" activeUnderlineColor="transparent"/>
                :
                <WhiteReadOnlyField testID={p.testID} label={p.label} value={values.value} />
            }
            <RightAlignedModifyButtons testID={`${p.testID}:InlineButtons`} editing={editing} saveButtonDisabled={!touched} saveButtonColor={touched ? '#000' : '#555'}
                onEditRequested={() => {
                    setEditing(true)
                    setImmediate(() =>  textInputRef.current?.focus())
                }} onSave={() => handleSubmit()} onCancelEdit={() => {
                    setEditing(false)                                                 
                    setFieldValue('value', initialValues.value)
                }} onDelete={p.onDelete} />
            <ErrorMessage component={OrangeBackedErrorText} name="value" />
            { submitCount > 0 && !isValid && <View style={{ marginTop: 20, width: aboveMdWidth() ? '60%' : '80%', alignSelf: 'center' }}>
                <OrangeBackedErrorText>{t('someDataInvalid')}</OrangeBackedErrorText>
            </View>}
        </View>
    }}
    </Formik>
}

export default InlineFormTextInput