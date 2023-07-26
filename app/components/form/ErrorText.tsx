import { Text } from "@react-native-material/core";
import React from "react";


export default function ErrorText(props: any) {
    return <Text style={{ color: 'red' }}>{props.children}</Text>
}