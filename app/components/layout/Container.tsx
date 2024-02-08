import { ScrollView, StyleProp, Text, View, ViewStyle } from "react-native"
import { primaryColor } from "./constants"
import React, { ReactNode, useContext } from "react"
import { AppContext } from "@/components/AppContextProvider"
import { diagnostic } from "@/lib/settings"
import { IconButton } from "react-native-paper"

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
        { appContext.state.messages.length > 0 && diagnostic === '1' && 
            <View style={{ backgroundColor: '#ddd', flexGrow: 0, flexShrink: 1, flexBasis: '20%', flexDirection: 'row' }}>
                <IconButton icon="close" size={10} onPress={appContext.actions.resetMessages}/>
                <ScrollView>
                    {appContext.state.messages.reverse().map((msg, idx) => <Text key={idx}>{msg}</Text>)}
                </ScrollView>
            </View>}
    </View>
}

export default Container