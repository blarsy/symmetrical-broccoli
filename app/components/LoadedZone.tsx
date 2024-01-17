import { StateError } from "@/lib/DataLoadState"
import { t } from "i18next"
import React from "react"
import { ActivityIndicator, StyleProp, View, ViewStyle } from "react-native"
import { Snackbar } from "react-native-paper"

interface Props {
    loading: boolean,
    error?: StateError,
    children?: React.ReactNode,
    containerStyle?: StyleProp<ViewStyle>
}

function LoadedZone({ loading, error, children, containerStyle }: Props) {
    return <View style={containerStyle || { flexDirection: 'column' }}>
        { loading && <ActivityIndicator /> }
        { !loading && !error && children }
        {/* Give some height to the element hosting snackbar, because otherwise it will not have any, as it a div with absolute position */}
        { error && <View style={{ height: 60 }}>
            <Snackbar role="alert" visible={!!error} onDismiss={() => {}}>{t('requestError')}</Snackbar>
        </View> }
    </View>
}

export default LoadedZone