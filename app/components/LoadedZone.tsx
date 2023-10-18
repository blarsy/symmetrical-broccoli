import { StateError } from "@/lib/DataLoadState"
import { t } from "i18next"
import React from "react"
import { ActivityIndicator, View } from "react-native"
import { Snackbar } from "react-native-paper"

interface Props<T> {
    loading: boolean,
    error?: StateError,
    children: JSX.Element
}

function LoadedZone<T>({ loading, error, children }: Props<T>) {
    return <View style={{ flexDirection: 'column', paddingTop: 10, paddingBottom: 10 }}>
        { loading && <ActivityIndicator /> }
        { !loading && !error && children }
        {/* Give some height to the element hosting snackbar, because otherwise it will not have any, as it a div with absolute position */}
        { error && <View style={{ height: 60 }}>
            <Snackbar role="alert" visible={!!error} onDismiss={() => {}}>{t('requestError')}</Snackbar>
        </View> }
    </View>
}

export default LoadedZone