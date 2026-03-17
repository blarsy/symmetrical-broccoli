import React from "react"
import { View } from "react-native"
import { Icon, IconButton, Text, Tooltip } from "react-native-paper"
import { primaryColor } from "../layout/constants"
import Images from "@/Images"
import { VariantProp } from "react-native-paper/lib/typescript/components/Typography/types"
import { t } from "@/i18n"
import TokenValueDialog from "./TokenValueDialog"

export enum PriceTagSizeEnum {
    small,
    normal,
    big
}

const PriceTag = ({ value, label, size }: { value: number, label?: string, size?: PriceTagSizeEnum }) => {
    const [showingInfoDialog, setShowingInfoDialog] = React.useState(false)

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
    
    return <Tooltip title={t('topeTooltip')} enterTouchDelay={1}>
        <View style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
            { label && <Text style={{ color: primaryColor, fontSize, lineHeight: fontSize }} variant={variant}>{label} </Text> }
            <Text style={{ color: primaryColor, fontSize, lineHeight: fontSize }} variant={variant}>{value} </Text>
            <Images.Tokens style={{ width: iconSize, height: iconSize }}/>
            <IconButton icon="help-circle" size={20} onPress={() => {
                setShowingInfoDialog(true)
            }} />
            <TokenValueDialog visible={showingInfoDialog} 
                onDismiss={() => setShowingInfoDialog(false)} 
                title={t('topeValueTitle')} 
                tokenValue={value}
            /> 
        </View>
    </Tooltip>
}

export default PriceTag