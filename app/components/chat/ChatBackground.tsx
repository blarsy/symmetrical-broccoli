import Images from "@/Images"
import React from "react"
import { ReactNode } from "react"
import { View } from "react-native"
import { lightPrimaryColor } from "../layout/constants"

export default ({ children }: { children: ReactNode }) => {
    return <View style={{ display: 'flex', flex: 1, backgroundColor: '#fff' }}>
    <Images.BackgroundChat fill={lightPrimaryColor} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    />
    { children }
</View>
}