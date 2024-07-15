import { ImageZoom } from "@likashefqet/react-native-image-zoom"
import React from "react"
import { Dimensions, ImageSourcePropType } from "react-native"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import { Modal, Portal } from "react-native-paper"

interface Props {
    source?: ImageSourcePropType
    onDismess: () => void
}

const PanZoomImage = ({ source, onDismess }: Props) => {
    const dims = Dimensions.get("window")
    const size = Math.min(dims.height, dims.width)
    return <Portal>
        <Modal dismissable onDismiss={onDismess} visible={ !!source }>
            { source && <GestureHandlerRootView style={{ width: size, height: size }}>
                <ImageZoom
                    source={source}
                    minScale={0.5}
                    maxScale={5}
                    resizeMode="contain"
                />
            </GestureHandlerRootView> }
        </Modal>
    </Portal>
}

export default PanZoomImage