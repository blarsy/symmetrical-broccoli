import { Formik, FormikConfig, FormikValues } from "formik"
import React from "react"
import { KeyboardAvoidingView, Platform } from "react-native"

function KeyboardAvoidingForm<Values extends FormikValues = FormikValues, ExtraProps = {}>(props: FormikConfig<Values> & ExtraProps) {
    return <KeyboardAvoidingView behavior={ Platform.OS === 'ios' ? 'padding': undefined }>
        <Formik {...props}/>
    </KeyboardAvoidingView>
}

export default KeyboardAvoidingForm