import { t } from "i18next"
import React from "react"
import { Text } from "react-native"

interface Props<T> {
    data?: T[],
    displayItem: (item: T) => JSX.Element
}

function ListOf<T>({data, displayItem}: Props<T>) {
    if(data && data.length > 0) {
        return data.map(item => displayItem(item))
    } else {
        return <Text>{t('noData')}</Text>
    }
}

export default ListOf