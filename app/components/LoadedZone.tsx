import { StateError } from "@/lib/DataLoadState"
import React from "react"
import { ActivityIndicator, StyleProp, View, ViewStyle } from "react-native"
import { ErrorSnackbar } from "./OperationFeedback"

interface Props {
    loading: boolean,
    error?: StateError,
    children?: React.ReactNode,
    containerStyle?: StyleProp<ViewStyle>
}

function LoadedZone({ loading, error, children, containerStyle }: Props) {
    return <View style={containerStyle || { flexDirection: 'column', justifyContent: 'center' }}>
        { loading && <ActivityIndicator style={{ flex: 1 }}/> }
        { !loading && !error && children }
        {/* Give some height to the element hosting snackbar, because otherwise it will not have any, as it a div with absolute position */}
        { error && <View style={{ height: 60 }}>
            <ErrorSnackbar message={error.message} onDismissError={() => {}} />
        </View> }
    </View>
}

export default LoadedZone