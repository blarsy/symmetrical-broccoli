import React from "react";
import { PropsWithChildren, useState } from "react";
import { View, TouchableOpacity } from "react-native";
import { Icon, Text } from "react-native-paper";

type AccordionItemPros = PropsWithChildren<{
    title: string;
  }>
  
export default ({ children, title }: AccordionItemPros): JSX.Element => {
    const [ expanded, setExpanded ] = useState(false)


    const body = <View>{ children }</View>
  
    return (
      <View>
        <TouchableOpacity onPress={ () => setExpanded(!expanded) }>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 16, paddingRight: 16 }}>
                <Text variant="bodyMedium">{ title }</Text>
                <Icon source={ expanded ? 'chevron-up' : 'chevron-right' }
                    size={26} />
            </View>
        </TouchableOpacity>
        { expanded && body }
      </View>
    )
  }
