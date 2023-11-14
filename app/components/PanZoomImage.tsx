import { ImageZoom } from "@likashefqet/react-native-image-zoom"
import React from "react"
import { Dimensions, ImageSourcePropType } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"

interface Props {
    uri?: string
}

const PanZoomImage = ({ uri }: Props) => {
    const dims = Dimensions.get("window")
    const size = Math.min(dims.height, dims.width)
    return <GestureHandlerRootView style={{ width: size, height: size, borderColor: 'red', borderWidth: 1 }}>
        <ImageZoom
            uri={uri}
            minScale={0.5}
            maxScale={5}
            resizeMode="contain"
        />
    </GestureHandlerRootView>
}

export default PanZoomImage