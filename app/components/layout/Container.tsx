import { StyleProp, Text, View, ViewStyle } from "react-native"
import { primaryColor } from "./constants"
import React, { useContext } from "react"
import { AppContext } from "../AppContextProvider"
import { diagnostic } from "../../lib/settings"
import Swipeable from 'react-native-gesture-handler/Swipeable'

interface Props {
    children: JSX.Element,
    style: StyleProp<ViewStyle>
}

const Container = ({ children, style }:Props) => {
    const appContext = useContext(AppContext)
    return <View style={{ flex: 1, flexDirection: 'column' }}>
        <View style={{...{ flex: 1, backgroundColor: primaryColor, alignItems: 'center', justifyContent: 'center' }, ...(style as Object) }}>
            {children}
        </View>
        { appContext.state.message && diagnostic === '1' && 
            <View style={{ backgroundColor: '#ddd', flexGrow: 0, flexShrink: 1, flexBasis: '20%', overflow: 'scroll' }}>
                <Swipeable onSwipeableClose={(direction) => {
                        if(direction === 'left') appContext.actions.setMessage('')
                    }}>
                    <Text>{appContext.state.message}</Text>
                </Swipeable>
            </View>}
    </View>
}

export default Container