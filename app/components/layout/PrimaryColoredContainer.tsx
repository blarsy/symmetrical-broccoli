import React from "react"
import { primaryColor } from "./constants"
import Container from "./Container"
import { StyleProp, View, ViewStyle } from "react-native"

interface Props {
    children: React.ReactNode,
    style?: StyleProp<ViewStyle>
    testID?: string
}

export default ({ children, style, testID }: Props) => <Container testID={testID} style={{ backgroundColor: primaryColor, ...(style as object) }}>
    {children}
</Container>