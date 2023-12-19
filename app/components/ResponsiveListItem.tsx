import React from 'react'
import { List, useTheme } from "react-native-paper";
import { Props } from 'react-native-paper/lib/typescript/components/List/ListItem'

const ResponsiveListItem = (props: Props) => {
    const theme = useTheme()
    return <List.Item titleNumberOfLines={2}
        titleStyle={{ fontFamily: theme.fonts.headlineLarge.fontFamily, fontSize: theme.fonts.headlineMedium.fontSize }} 
        descriptionStyle={{ fontSize: theme.fonts.bodyMedium.fontSize }} {...props} />
}

export default ResponsiveListItem