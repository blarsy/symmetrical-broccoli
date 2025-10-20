import { StyleProp, View, ViewStyle } from "react-native"
import { primaryColor } from "./constants"
import React, { ReactNode } from "react"

interface Props {
    children: ReactNode,
    style: StyleProp<ViewStyle>
    testID?: string
}

const Container = ({ children, style, testID }:Props) => {
    return <View testID={testID} style={{ flex: 1, flexDirection: 'column' }}>
        <View style={{ flex: 1, backgroundColor: primaryColor, alignItems: 'center', justifyContent: 'center' , ...(style as Object) }}>
            {children}
        </View>
    </View>
}

export default Container