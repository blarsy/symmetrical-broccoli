import React, { ReactNode } from "react"
import { StyleProp, View, ViewStyle } from "react-native"

interface Props {
    children: ReactNode,
    style?: StyleProp<ViewStyle>
}

export default ({ children, style }: Props) => <View style={{ ...(style as object) }}>
    {children}
</View>