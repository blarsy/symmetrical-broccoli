import { StyleProp, Text, View, ViewStyle } from "react-native"
import { primaryColor } from "./constants"
import React, { useContext } from "react"
import { Stack } from "@react-native-material/core"
import { AppContext } from "../AppContextProvider"
import { diagnostic } from "../../lib/settings"

interface Props {
    children: JSX.Element,
    style: StyleProp<ViewStyle>
}

const Container = ({ children, style }:Props) => {
    const appContext = useContext(AppContext)
    return <Stack style={{ flex: 1 }}>
        <View style={{...{ flex: 1, backgroundColor: primaryColor, alignItems: 'center', justifyContent: 'center' }, ...(style as Object) }}>
            {children}
        </View>
        { appContext.state.message && diagnostic === '1' && <View style={{ backgroundColor: '#ddd', flexGrow: 0, flexShrink: 1, flexBasis: '20%', overflow: 'scroll' }}>
            <Text>{appContext.state.message}</Text>
        </View>}
    </Stack>
}

export default Container