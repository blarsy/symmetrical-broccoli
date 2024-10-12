import React from "react"
import { TouchableOpacity } from "react-native-gesture-handler"
import { Icon, Text } from "react-native-paper"
import { primaryColor } from "./layout/constants"
import { ColorValue, View } from "react-native"

interface Props {
    value: boolean
    onChange: (newValue: boolean) => void
    title: string
    selectedColor?: ColorValue
    color?: ColorValue
    testID: string
}

const OptionSelect = ({ value, onChange, title, selectedColor, color, testID }: Props) => {
    return <TouchableOpacity testID={`${testID}:Button`} onPress={() => onChange(!value)}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 5, gap: 5 }}>
            <Icon source={ value ? 'checkbox-marked' : 'checkbox-blank-outline' } size={28} color={value ? selectedColor?.toString() || primaryColor : color?.toString() || '#000'} />
            <Text variant="bodyMedium" style={{ color: value ? selectedColor?.toString() || primaryColor : color?.toString() || '#000' }}>{title}</Text>
        </View>
    </TouchableOpacity>
}

export default OptionSelect