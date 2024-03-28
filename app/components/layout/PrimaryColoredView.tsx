import React from "react"
import { primaryColor } from "./constants"
import { StyleProp, View, ViewStyle } from "react-native"

interface Props {
    children: JSX.Element,
    style?: StyleProp<ViewStyle>
}

export default ({ children, style }: Props) => <View style={{ backgroundColor: primaryColor, ...(style as object) }}>
    {children}
</View>