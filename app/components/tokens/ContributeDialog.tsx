import { t } from "i18next"
import React from "react"
import { Dimensions } from "react-native"
import { ThemedDialog } from "../ConfirmDialog"
import HowItWorksSwiper from "./HowItWorksSwiper"

interface Props {
    visible: boolean
    title: string
    testID?: string
    onDismiss: () => void
    onBecameContributor: () => void
}

const ContributeDialog = (p: Props) => {
    const { width: winWidth, height: winHeight } = Dimensions.get('screen')
    const width = Math.min(400, winWidth)
    const height = Math.min(winHeight - 120, 700)
    const subViewHeight = height - 80
    const childWidth = width - 52

    return <ThemedDialog testID={p.testID} onDismiss={p.onDismiss} visible={p.visible} 
        title={p.title} style={{
            width, height, marginTop: 0, marginLeft: width === winWidth ? 0 : (winWidth - width) / 2,
        }} contentStyle={{ height: subViewHeight }}
        content={
            <HowItWorksSwiper onBecameContributor={() => {
                p.onBecameContributor()
                p.onDismiss()
            }} width={childWidth} />
        }/>
}

export default ContributeDialog