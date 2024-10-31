import React from "react"
import { ColorValue, TouchableOpacity, View } from "react-native"
import { Icon } from "react-native-paper"
import { SvgProps } from "react-native-svg"

interface Props {
    Image: React.FC<SvgProps> | string
    size: number
    onPress: () => void
    color?: ColorValue
    testID?: string
    disabled?: boolean
}

export default ({ Image, size, onPress, color, testID, disabled }: Props) => <TouchableOpacity disabled={disabled} testID={testID} onPress={onPress}>
    <View style={{ width: size }}>{ typeof Image === 'string' ?
        <Icon size={size} source={Image} />
        : <Image fill={color} style={{ width: size, height: size }} /> 
    }</View>
</TouchableOpacity>