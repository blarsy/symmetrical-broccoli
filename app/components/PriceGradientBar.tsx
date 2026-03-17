import { LinearGradient } from "expo-linear-gradient"
import React, { useRef } from "react"
import { Pressable, View } from "react-native"
import { Icon } from "react-native-paper"
import { primaryColor } from "./layout/constants"

interface PriceGradientBarProps {
  percent: number
  barHeight?: number
  testID?: string
  onPercentChanged: (percent: number) => void
}

const PriceGradientBar = ({ percent, barHeight = 20, testID, onPercentChanged }: PriceGradientBarProps) => {
  const displayPercent = Math.max(0, Math.min(percent, 100))
  const markerWidth = 30
  const markerTop = Math.max(0, barHeight - 8)
  const widthRef = useRef(0)
  const markerDeltaToCenter = (markerWidth / 4) / (widthRef.current || 1) * 100
  const markerLeft = Math.max(Math.min(displayPercent - markerDeltaToCenter, 100-(markerDeltaToCenter * 2)), markerDeltaToCenter)

  const handleLayout = (event: any) => {
    widthRef.current = event.nativeEvent.layout.width
    onPercentChanged(displayPercent)
  }

  const handlePressIn = (event: any) => {
    const x = event.nativeEvent.locationX
    const width = widthRef.current || 1
    let percent = (x / width) * 100

    if (percent < 0) percent = 0
    if (percent > 100) percent = 100

    onPercentChanged(percent)
  }

  return (
    <Pressable
      onLayout={handleLayout}
      onPressIn={handlePressIn}
      testID={testID}
      style={{ width: '100%', borderColor: primaryColor, borderWidth: 1 }}
    >
      <LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        colors={['#fef0e3', '#fef0e3', '#ffb873', '#ffb873', '#ff770c', '#ff770c', '#ff4401', '#ff4401']}
        locations={[0, 0.25, 0.25, 0.5, 0.5, 0.75, 0.75, 1]}
        style={{ width: '100%', height: barHeight }}
      />
      <View style={{ position: 'absolute', width: '100%', left: `${markerLeft}%`, top: markerTop, transform: [{ translateX: -8 }] }}>
        <Icon source="chevron-up" size={markerWidth} />
      </View>
    </Pressable>
  )
}

export default PriceGradientBar