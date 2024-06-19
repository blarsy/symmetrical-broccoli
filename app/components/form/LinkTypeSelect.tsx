import { LinkTypes, getIconForLink } from "@/lib/schema"
import React from "react"
import { StyleProp, View, ViewStyle } from "react-native"
import { Icon, IconButton } from "react-native-paper"
import { primaryColor } from "../layout/constants"

interface Props {
    selected?: LinkTypes,
    onSelectedChanged: (newValue: number) => void
    style: StyleProp<ViewStyle>
}

export default ({ selected, onSelectedChanged, style }: Props) => {
    return <View style={{...{ flexDirection: 'row' }, ...(style as Object)} }>
        { [1, 2, 3, 4].map(val => <View key={val} style={{ flexDirection: 'column', alignItems: 'center' }}>
            <IconButton iconColor={primaryColor} style={{ margin: 0 }} icon={getIconForLink(val as LinkTypes)} onPress={() => onSelectedChanged(val)}/>
            { val === selected && <Icon color={primaryColor} size={25} source="arrow-up-bold"/> }
        </View> )}
    </View>
} 