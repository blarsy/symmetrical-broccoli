import { TextInput, TextInputProps } from "react-native-paper"
import { primaryColor } from "../layout/constants"
import React from "react"

const OrangeTextInput = (props: TextInputProps) => <TextInput 
    placeholderTextColor="#ddd" mode="flat" textColor="#fff" underlineColor="#fff"
    activeUnderlineColor="#fff" selectionColor="transparent"q
    theme={{ colors: { onSurfaceVariant: '#ddd'} }}
    contentStyle={{
        color: '#fff',
        fontSize: 16
    }} style={{
    backgroundColor: primaryColor,
    marginTop: 10,
}}  {...props}/>

export default OrangeTextInput