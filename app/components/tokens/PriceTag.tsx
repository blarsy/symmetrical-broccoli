import React from "react"
import { View } from "react-native"
import { Text, Tooltip } from "react-native-paper"
import { primaryColor } from "../layout/constants"
import Images from "@/Images"
import { VariantProp } from "react-native-paper/lib/typescript/components/Typography/types"

export enum PriceTagSizeEnum {
    small,
    normal,
    big
}

const PriceTag = ({ value, label, size }: { value: number, label?: string, size?: PriceTagSizeEnum }) => {
    let iconSize: number, fontSize: number, variant: VariantProp<never>
    switch(size) {
        case PriceTagSizeEnum.big:
            iconSize= 60
            fontSize= 30
            variant= 'headlineLarge'
            break
        case PriceTagSizeEnum.normal:
            iconSize= 45
            fontSize= 22
            variant= 'bodyLarge'
            break
        case PriceTagSizeEnum.small:
        default:
            iconSize= 30
            fontSize= 15
            variant= 'bodyMedium'
    }
    
    return <Tooltip title={`${value} Topes = ${value / 100} Euro`} enterTouchDelay={1}>
        <View style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
            { label && <Text style={{ color: primaryColor, fontSize, lineHeight: fontSize }} variant={variant}>{label} </Text> }
            <Text style={{ color: primaryColor, fontSize, lineHeight: fontSize }} variant={variant}>{value} </Text>
            <Images.Tokens style={{ width: iconSize, height: iconSize }}/>
        </View>
    </Tooltip>
}

export default PriceTag