import { StyleProp, View, ViewStyle } from "react-native"
import { primaryColor } from "./constants"
import React, { ReactNode } from "react"

interface Props {
    children: ReactNode,
    style: StyleProp<ViewStyle>
}

const Container = ({ children, style }:Props) => {
    return <View style={{ flex: 1, flexDirection: 'column', borderWidth: 12, borderColor: 'green' }}>
        <View style={{ flex: 1, backgroundColor: primaryColor, alignItems: 'center', justifyContent: 'center' , ...(style as Object) }}>
            {children}
        </View>
    </View>
}

export default Container