import React from "react"
import { ActivityIndicator, ScrollView, View } from "react-native"
import ListOf from "./ListOf"
import { Snackbar } from "react-native-paper"
import { t } from "@/i18n"
import { StateError } from "@/lib/DataLoadState"

interface Props<T> {
    loading: boolean,
    error?: StateError,
    data?: T[],
    displayItem: (item: T, index: number) => JSX.Element
}

function LoadedList<T>({ loading, error, data, displayItem }:Props<T>) {
    return <ScrollView style={{ flexDirection: 'column', paddingTop: 10, paddingBottom: 10 }}>
    { loading && <ActivityIndicator /> }
    { !loading && !error && <ListOf data={data} displayItem={displayItem} /> }
    {/* Give some height to the element hosting snackbar, because otherwise it will not have any, as it a div with absolute position */}
    { error && <View style={{ height: 60 }}>
        <Snackbar role="alert" visible={!!error} onDismiss={() => {}}>{t('requestError')}</Snackbar>
    </View> }
</ScrollView>
}

export default LoadedList