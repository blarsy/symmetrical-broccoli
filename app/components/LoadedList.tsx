import React, { ReactNode, useState } from "react"
import { ActivityIndicator, Dimensions, NativeScrollEvent, StyleProp, View, ViewStyle } from "react-native"
import ListOf from "./ListOf"
import { StateError } from "@/lib/DataLoadState"
import { ErrorSnackbar } from "./OperationFeedback"
import { primaryColor } from "./layout/constants"
import { ScrollView } from "react-native-gesture-handler"

interface Props<T> {
    loading: boolean,
    error?: StateError,
    data?: T[],
    displayItem: (item: T, index: number) => ReactNode
    noDataLabel?: string | ReactNode,
    style?: StyleProp<ViewStyle>,
    contentContainerStyle? : StyleProp<ViewStyle>
    testID?: string
    loadEarlier?: () => Promise<void>
}

function LoadedList<T>({ loading, error, data, displayItem, noDataLabel, style, contentContainerStyle, testID, loadEarlier}:Props<T>) {
    let actualStyle: StyleProp<ViewStyle>
    const basicStyle: StyleProp<ViewStyle> = { flexDirection: 'column', paddingTop: 10, paddingBottom: 10, maxWidth: Dimensions.get('window').width, alignSelf: 'stretch' }
    const [loadingEarlier, setLoadingEarlier] = useState(false)

    if(style) {
        actualStyle = { ...basicStyle, ...(style as object) }
    } else {
        actualStyle = basicStyle
    }

    return <ScrollView onScroll={async ({ nativeEvent }) => {
        const isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}: NativeScrollEvent) => {
            return layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;
        }
        
        if (loadEarlier && !loadingEarlier && isCloseToBottom(nativeEvent)) {
            setLoadingEarlier(true)
            try {
                await loadEarlier()
            }
            finally {
                setLoadingEarlier(false)
            }
        }
      }} scrollEventThrottle={100} style={actualStyle} contentContainerStyle={contentContainerStyle}>
        { loading && <View style={{ flex:1, alignContent: 'center' }}><ActivityIndicator testID={`${testID}:Loader`} color={primaryColor} /></View> }
        { !loading && !error && <>
            <ListOf loadingEarlier={loadingEarlier} testID={testID} data={data} displayItem={displayItem} noDataLabel={noDataLabel} />
            { loadingEarlier && <ActivityIndicator testID={`${testID}:MoreLoader`} color={primaryColor} /> }
        </>}
        {/* Give some height to the element hosting snackbar, because otherwise it will not have any, as it a div with absolute position */}
        { error && <View style={{ height: 60 }}>
            <ErrorSnackbar testID="ListLoadError" message={error.message} error={error} onDismissError={() => {}} />
        </View> }
    </ScrollView>
}

export default LoadedList