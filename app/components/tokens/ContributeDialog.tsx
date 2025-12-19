import React from "react"
import { Dimensions, View } from "react-native"
import { ThemedDialog } from "../ConfirmDialog"
import HowItWorksSwiper from "./HowItWorksSwiper"
import { GestureHandlerRootView } from "react-native-gesture-handler"

interface Props {
    visible: boolean
    testID?: string
    onDismiss: () => void
}

const ContributeDialog = (p: Props) => {
    const { width: winWidth, height: winHeight } = Dimensions.get('screen')
    const width = Math.min(400, winWidth)
    const height = Math.min(winHeight - 120, 700)
    const subViewHeight = height - 80
    const childWidth = width - 52

    return <ThemedDialog testID={p.testID} onDismiss={p.onDismiss} visible={p.visible} 
        style={{
            width, height, marginTop: 0, marginLeft: width === winWidth ? 0 : (winWidth - width) / 2,
        }} contentStyle={{ height: subViewHeight }}
        content={
            <GestureHandlerRootView>
                <View style={{ justifyContent: 'space-between' }}>
                    <HowItWorksSwiper width={childWidth}/>
                </View>
            </GestureHandlerRootView>
        }/>
}

export default ContributeDialog