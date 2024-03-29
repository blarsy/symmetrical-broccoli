import { t } from "i18next"
import React from "react"
import { Text } from "react-native"

interface Props<T> {
    data?: T[]
    displayItem: (item: T, index: number) => JSX.Element
    noDataLabel?: string
}

function ListOf<T>({data, displayItem, noDataLabel}: Props<T>) {
    if(data && data.length > 0) {
        return data.map((item, idx) => displayItem(item, idx))
    } else {
        return <Text style={{ textAlign: 'center', textTransform: 'uppercase', margin:10 }}>{noDataLabel || t('noData')}</Text>
    }
}

export default ListOf