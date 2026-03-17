import React from "react"
import { Text } from "react-native-paper"
import { ThemedDialog } from "../ConfirmDialog"
import { t } from "@/i18n"
import PriceInfo from "./PriceInfo"
import { Dimensions, View } from "react-native"

interface Props {
    visible: boolean
    title: string
    testID?: string
    onDismiss: () => void
    tokenValue: number
}

const TokenValueDialog = ({ visible, title, testID, onDismiss, tokenValue }: Props) => {
    const { height: winHeight } = Dimensions.get('screen')

    return <ThemedDialog onDismiss={onDismiss} style={{ minHeight: winHeight * 0.8 }} content={
        <View style={{ gap: 10 }}>
            <Text variant="bodyLarge">
                {t('topeValueExplanation')}
            </Text>
            <Text variant="bodyLarge">
                {t('topeValueExplanation2')}
            </Text>
            <PriceInfo tokenValue={tokenValue} />
        </View>} title={title} visible={visible} testID={testID} />
}
    
export default TokenValueDialog