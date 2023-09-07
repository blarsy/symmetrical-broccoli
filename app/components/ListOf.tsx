import { t } from "i18next"
import React from "react"
import { Text } from "react-native"

interface Props<T> {
    data?: T[],
    displayItem: (item: T, index: number) => JSX.Element
}

function ListOf<T>({data, displayItem}: Props<T>) {
    if(data && data.length > 0) {
        return data.map((item, idx) => displayItem(item, idx))
    } else {
        return <Text style={{ textAlign: 'center', textTransform: 'uppercase' }}>{t('noData')}</Text>
    }
}

export default ListOf