import { StyleProp, View, ViewStyle } from "react-native"
import { primaryColor } from "./constants"
import React, { ReactNode, useContext } from "react"
import { AppContext } from "@/components/AppContextProvider"

interface Props {
    children: ReactNode,
    style: StyleProp<ViewStyle>
}

const Container = ({ children, style }:Props) => {
    const appContext = useContext(AppContext)
    return <View style={{ flex: 1, flexDirection: 'column' }}>
        <View style={{ flex: 1, backgroundColor: primaryColor, alignItems: 'center', justifyContent: 'center' , ...(style as Object) }}>
            {children}
        </View>
    </View>
}

export default Container