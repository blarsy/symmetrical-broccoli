import { TextInput, TextInputProps } from "react-native-paper"
import { primaryColor } from "@/components/layout/constants"
import React from "react"

const OrangeTextInput = (props: TextInputProps) => <TextInput 
    {...props}
    placeholderTextColor="#ddd" mode="flat" textColor="#fff" underlineColor="#fff"
    activeUnderlineColor="#fff" selectionColor="transparent"
    theme={{ colors: { onSurfaceVariant: '#ddd'} }}
    contentStyle={{
        color: '#fff',
        fontSize: 16
    }} style={Object.assign({
        backgroundColor: primaryColor,
        marginTop: 10,
    }, props.style)}/>

export default OrangeTextInput