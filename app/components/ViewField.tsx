import React, { ReactNode } from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { Text } from "react-native-paper"

interface ResourceViewFieldProps {
    title: string
    children: ReactNode
    titleOnOwnLine?: boolean
    style?: StyleProp<ViewStyle>
}

const ViewField = ({ title, children, titleOnOwnLine, style }: ResourceViewFieldProps) => <View style={{ 
        flexDirection: titleOnOwnLine ? "column": "row", gap: titleOnOwnLine ? 0: 10, 
        alignItems: titleOnOwnLine ?  'stretch' : 'center',
        ...(style as object)
    }}>
    <Text variant="titleLarge" style={{ flexGrow: titleOnOwnLine ? 1: 0, flexShrink: titleOnOwnLine ? 1: 0, flexBasis: 'auto' }}>{title}</Text>
    <View style={{ flex: 1, alignItems: titleOnOwnLine ? undefined : 'center' }}>
        {children}
    </View>
</View>

export default ViewField