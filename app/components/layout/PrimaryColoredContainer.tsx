import React from "react"
import { primaryColor } from "./constants"
import Container from "./Container"
import { StyleProp, View, ViewStyle } from "react-native"

interface Props {
    children: React.ReactNode,
    style?: StyleProp<ViewStyle>
}

export default ({ children, style }: Props) => <Container style={{ backgroundColor: primaryColor, ...(style as object) }}>
    {children}
</Container>