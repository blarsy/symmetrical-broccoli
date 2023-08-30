import React from "react"
import { View } from "react-native"
import { primaryColor } from "./constants"

interface Props {
    children: JSX.Element
}

export default ({ children }: Props) => <View style={{ flex: 1, backgroundColor: primaryColor, alignItems: 'center', justifyContent: 'center' }}>
    {children}
</View>