import React from 'react'
import { List, useTheme } from "react-native-paper";
import { Props } from 'react-native-paper/lib/typescript/components/List/ListItem'

const ResponsiveListItem = (props: Props) => {
    const theme = useTheme()
    return <List.Item style={props.style} titleNumberOfLines={2} titleStyle={{ fontSize: theme.fonts.bodyLarge.fontSize }} descriptionStyle={{ fontSize: theme.fonts.bodyMedium.fontSize }} {...props} />
}

export default ResponsiveListItem