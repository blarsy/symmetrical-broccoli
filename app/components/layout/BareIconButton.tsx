import React, { useState } from "react"
import { ColorValue, GestureResponderEvent, Pressable, StyleProp, View, ViewStyle } from "react-native"
import { Icon } from "react-native-paper"
import { SvgProps } from "react-native-svg"
import { lightPrimaryColor } from "./constants"

interface Props {
    Image: React.FC<SvgProps> | string
    size: number
    onPress: (event: GestureResponderEvent) => void
    color?: ColorValue
    testID?: string
    disabled?: boolean
    style?: StyleProp<ViewStyle>
}

export default ({ Image, size, onPress, color, testID, disabled, style }: Props) => {
    const [pressed, setPressed] = useState(false)

    return <Pressable disabled={disabled} testID={testID} 
        onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}
        onPress={onPress} style={{
            opacity: pressed ? 0.6 : 1
        }}>
        <View style={{ width: size, height: size, ...(style as object) }}>{ typeof Image === 'string' ?
            <Icon color={color as string} size={size} source={Image} />
            : <Image fill={color} width={size} height={size} /> 
        }</View>
    </Pressable>
}