import React, { useState } from "react"
import { ColorValue, Pressable, View } from "react-native"
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

export default ({ Image, size, onPress, color, testID, disabled }: Props) => {
    const [pressed, setPressed] = useState(false)

    return <Pressable disabled={disabled} testID={testID} 
        onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}
        onPress={onPress} style={{
            opacity: pressed ? 0.6 : 1
        }}>
        <View style={{ width: size }}>{ typeof Image === 'string' ?
            <Icon size={size} source={Image} />
            : <Image fill={color} style={{ width: size, height: size }} /> 
        }</View>
    </Pressable>
}