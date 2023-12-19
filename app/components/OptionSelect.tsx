import React from "react"
import { TouchableOpacity } from "react-native-gesture-handler"
import { Icon, Text } from "react-native-paper"
import { primaryColor } from "./layout/constants"
import { View } from "react-native"

interface Props {
    value: boolean
    onChange: (newValue: boolean) => void
    title: string
}

const OptionSelect = ({ value, onChange, title }: Props) => {
    return <TouchableOpacity onPress={() => onChange(!value)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 5, gap: 5 }}>
            <Icon source={ value ? 'check-circle-outline' : 'circle-outline' } size={28} color={value ? primaryColor : '#000'} />
            <Text variant="bodyMedium">{title}</Text>
        </View>
    </TouchableOpacity>
}

export default OptionSelect