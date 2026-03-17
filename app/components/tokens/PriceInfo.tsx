import React, { useState } from "react"
import { Text } from "react-native-paper"
import PriceGradientBar from "../PriceGradientBar"
import { t } from "@/i18n"
import { getPercentFromValue } from "@/lib/utils"

const getI18nFromPercent = (value: number) => {
    if (value <= 25) return 'priceLegUp'
    if (value <= 50) return 'priceFavor'
    if (value <= 75) return 'priceCommitment'
    return 'pricePrecious'
}

const getRangeI18nFromPercent = (value: number) => {
    if (value <= 25) return 'priceLegUpRange'
    if (value <= 50) return 'priceFavorRange'
    if (value <= 75) return 'priceCommitmentRange'
    return 'pricePreciousRange'
}

const PriceInfo = ({ tokenValue }: { tokenValue?: number }) => {
    const [priceBarPercent, setPriceBarPercent] = useState(getPercentFromValue(tokenValue || 0))
    return <>
        <PriceGradientBar percent={priceBarPercent} barHeight={20} onPercentChanged={percent => {
            let middlePercent
            if (percent <= 25) middlePercent = 12.5
            else if (percent <= 50) middlePercent = 37.5
            else if (percent <= 75) middlePercent = 62.5
            else middlePercent = 87.5
            setPriceBarPercent(middlePercent)
        }}/>
        <Text variant="bodyLarge">{t(getRangeI18nFromPercent(priceBarPercent))}</Text>
        <Text variant="bodyLarge">{t(getI18nFromPercent(priceBarPercent))}</Text>
    </>
}

export default PriceInfo