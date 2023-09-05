import React from "react";
import { Text, TextProps } from "react-native-paper";


export default function ErrorText(props: TextProps<never>) {
    return <Text style={{ color: 'red' }}>{props.children}</Text>
}

export const OrangeBackedErrorText = (props: TextProps<never>) => <Text style={{
    backgroundColor: 'orange', color: '#fff'
}}>{props.children}</Text>