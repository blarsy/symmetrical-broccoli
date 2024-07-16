import { t } from "i18next"
import React from "react"
import { StyleProp, Text, TextStyle } from "react-native"

interface Props<T> {
    data?: T[]
    displayItem: (item: T, index: number) => JSX.Element
    noDataLabel?: string | JSX.Element
    noDataLabelStyle?: StyleProp<TextStyle>
}

function ListOf<T>({data, displayItem, noDataLabel, noDataLabelStyle}: Props<T>) {
    if(data && data.length > 0) {
        return data.map((item, idx) => displayItem(item, idx))
    } else if(typeof noDataLabel === 'string' || !noDataLabel) {
        return <Text style={{ ...{ textAlign: 'center', textTransform: 'uppercase', margin:10 }, ...(noDataLabelStyle as object)}}>{noDataLabel || t('noData')}</Text>
    } else {
        return noDataLabel
    }
}

export default ListOf