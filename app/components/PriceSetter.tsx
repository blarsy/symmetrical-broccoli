import React, { useRef } from 'react'
import { View } from 'react-native'
import { InfoIcon, StyledLabel, TransparentTextInput } from './layout/lib'
import { t } from '@/i18n'
import { Text } from 'react-native-paper'
import PriceGradientBar from './PriceGradientBar'
import { getPercentFromValue } from '@/lib/utils'

interface Props {
    onChange: (newValue?: number) => void
    onBlur: () => void
    value: number | null
}

const getI18nFromValue = (value: number | null) => {
    if (value === null) return 'priceLegUp'
    if (value <= 100) return 'priceLegUp'
    if (value <= 1000) return 'priceFavor'
    if (value <= 5000) return 'priceCommitment'
    return 'pricePrecious'
}

const getValueFromPercent = (percent: number) => {
    const increment = 50
    if (percent <= 25) return roundToIncrementOf(percent * 4, increment)
    if (percent <= 50) return roundToIncrementOf(((percent - 25) * 4)/100 * 900 + 100, increment)
    if (percent <= 75) return roundToIncrementOf(((percent - 50) * 4)/100 * 4000 + 1000, increment)
    return roundToIncrementOf(((percent - 75) * 4)/100 * 5000 + 5000, increment)
}

const roundToIncrementOf = (value: number, increment: number) => {
    return Math.round(value / increment) * increment
}

const PriceSetter = (props: Props) => {

  return (
    <View style={{ gap: 5 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TransparentTextInput
          style={{ flex: 1 }}
          testID="price"
          label={<StyledLabel label={t('PriceLabel')} />}
          value={props.value?.toString()}
          onChangeText={val => props.onChange(isNaN(Number(val)) ? 0 : Number(val))}
          onBlur={props.onBlur}
        />
        <InfoIcon text={t('priceTooltip')} />
      </View>

      <View style={{ gap: 15, width: '100%' }}>
        <PriceGradientBar
          testID="priceInfo"
          percent={getPercentFromValue(props.value ?? 0)}
          onPercentChanged={percent => props.onChange(getValueFromPercent(percent))}
        />

        {props.value !== undefined && (
          <Text variant="bodyMedium" style={{ textAlign: 'center', width: '100%', flexWrap: 'wrap', paddingLeft: 10, paddingRight: 10 }}>
            {t(getI18nFromValue(props.value))}
          </Text>
        )}
      </View>
    </View>
  )
}

export default PriceSetter