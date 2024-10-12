import React from "react"
import { ActivityIndicator, Dimensions, ScrollView, StyleProp, View, ViewStyle } from "react-native"
import ListOf from "./ListOf"
import { StateError } from "@/lib/DataLoadState"
import { ErrorSnackbar } from "./OperationFeedback"

interface Props<T> {
    loading: boolean,
    error?: StateError,
    data?: T[],
    displayItem: (item: T, index: number) => JSX.Element
    noDataLabel?: string | JSX.Element,
    style?: StyleProp<ViewStyle>,
    contentContainerStyle? : StyleProp<ViewStyle>
}

function LoadedList<T>({ loading, error, data, displayItem, noDataLabel, style, contentContainerStyle }:Props<T>) {
    let actualStyle: StyleProp<ViewStyle>
    const basicStyle: StyleProp<ViewStyle> = { flexDirection: 'column', paddingTop: 10, paddingBottom: 10, maxWidth: Dimensions.get('window').width, alignSelf: 'stretch' }

    if(style) {
        actualStyle = { ...basicStyle, ...(style as object) }
    } else {
        actualStyle = basicStyle
    }

    return <ScrollView style={actualStyle} contentContainerStyle={contentContainerStyle}>
        { loading && <ActivityIndicator /> }
        { !loading && !error && <ListOf data={data} displayItem={displayItem} noDataLabel={noDataLabel} /> }
        {/* Give some height to the element hosting snackbar, because otherwise it will not have any, as it a div with absolute position */}
        { error && <View style={{ height: 60 }}>
            <ErrorSnackbar testID="ListLoadError" message={error.message} onDismissError={() => {}} />
        </View> }
    </ScrollView>
}

export default LoadedList