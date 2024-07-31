import React from "react"
import { View } from "react-native"
import { Text } from "react-native-paper"

interface ResourceViewFieldProps {
    title: string,
    children: JSX.Element,
    titleOnOwnLine?: boolean
}

const ViewField = ({ title, children, titleOnOwnLine }: ResourceViewFieldProps) => <View style={{ 
        flexDirection: titleOnOwnLine ? "column": "row", gap: titleOnOwnLine ? 0: 10, alignItems: titleOnOwnLine ?  'stretch' : 'center', borderBottomColor: '#000', borderBottomWidth: 1
    }}>
    <Text variant="titleMedium" style={{ flexGrow: titleOnOwnLine ? 1: 0, flexShrink: titleOnOwnLine ? 1: 0, flexBasis: titleOnOwnLine ? 'auto' : '40%' }}>{title}</Text>
    {children}
</View>

export default ViewField