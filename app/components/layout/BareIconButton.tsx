import React from "react"
import { TouchableOpacity, View } from "react-native"
import { Icon } from "react-native-paper"
import { SvgProps } from "react-native-svg"

interface Props {
    Image: React.FC<SvgProps> | string
    size: number
    onPress: () => void
}

export default ({ Image, size, onPress }: Props) => <TouchableOpacity onPress={onPress}>
    <View style={{ width: size }}>{ typeof Image === 'string' ?
        <Icon size={size} source={Image} />
        : <Image style={{ width: size, height: size }} /> 
    }</View>
</TouchableOpacity>