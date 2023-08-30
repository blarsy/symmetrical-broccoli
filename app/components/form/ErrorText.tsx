import { Text, TextProps } from "@react-native-material/core";
import React from "react";


export default function ErrorText(props: TextProps) {
    return <Text style={{ color: 'red' }}>{props.children}</Text>
}

export const OrangeBackedErrorText = (props: TextProps) => <Text style={{
    backgroundColor: 'orange', color: '#fff'
}}>{props.children}</Text>