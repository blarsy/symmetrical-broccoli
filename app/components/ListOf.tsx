import { t } from "i18next"
import React, { ReactNode } from "react"
import { StyleProp, Text, TextStyle, View } from "react-native"
import { ActivityIndicator } from "react-native-paper"
import { primaryColor } from "./layout/constants"

interface Props<T> {
    data?: T[]
    displayItem: (item: T, index: number) => ReactNode
    noDataLabel?: string | ReactNode
    noDataLabelStyle?: StyleProp<TextStyle>
    testID?: string
    loadingEarlier?: boolean
}

function ListOf<T>({data, displayItem, noDataLabel, noDataLabelStyle, testID, loadingEarlier}: Props<T>) {
    if(data && data.length > 0) {
        const elements = data.map((item, idx) => displayItem(item, idx))
        if(loadingEarlier) elements.push(<ActivityIndicator key="loader" testID={testID} color={primaryColor}/>)
        return elements
    } else if(typeof noDataLabel === 'string' || !noDataLabel) {
        return <Text testID={`${testID}:NoData`} style={{ ...{ textAlign: 'center', textTransform: 'uppercase', margin:10 }, ...(noDataLabelStyle as object)}}>{noDataLabel || t('noData')}</Text>
    } else {
        return <View testID={`${testID}:NoData`}>{noDataLabel}</View>
    }
}

export default ListOf