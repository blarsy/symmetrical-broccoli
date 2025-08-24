import { t } from "@/i18n"
import Images from "@/Images"
import React from "react"
import { View } from "react-native"
import { Text } from "react-native-paper"
import { VariantProp } from "react-native-paper/lib/typescript/components/Typography/types"

interface TokenTagProps {
    amountOfTokens: number
    labelI18n: string
    textVariant?: VariantProp<never>
    iconSize?: number
}

const TokenTag = (p: TokenTagProps) => <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 }}>
    <Text variant={p.textVariant || 'bodyLarge'}>{t(p.labelI18n)}:</Text>    
    <Text variant={p.textVariant || 'bodyLarge'}>{p.amountOfTokens}</Text>
    <Images.Tokens style={{ width: p.iconSize || 30, height: p.iconSize || 30 }}/>
    <Text variant={p.textVariant || 'bodyLarge'}>{t('tokenName')}</Text>
</View>

export default TokenTag