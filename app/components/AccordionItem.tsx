import React from "react";
import { PropsWithChildren, useState } from "react";
import { View, TouchableOpacity, StyleProp, ViewStyle, ColorValue } from "react-native";
import { Icon, Text } from "react-native-paper";

type AccordionItemProps = PropsWithChildren<{
    title: string,
    style?: StyleProp<ViewStyle>
    testID?: string
    big?: boolean
    textColor?: string
  }>
  
export default ({ children, title, style, testID, big, textColor }: AccordionItemProps): JSX.Element => {
    const [ expanded, setExpanded ] = useState(false)

    const body = <View>{ children }</View>

    return (
      <View style={{ marginTop: 10, ...(style as object) }}>
        <TouchableOpacity testID={`${testID}:Button`} onPress={ () => setExpanded(!expanded) }>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 16 }}>
                <Text style={{ color: textColor }} variant={big ? 'bodyLarge': 'bodyMedium'}>{ title }</Text>
                <Icon color={textColor} source={ expanded ? 'chevron-up' : 'chevron-right' } size={26} />
            </View>
        </TouchableOpacity>
        { expanded && body }
      </View>
    )
  }
