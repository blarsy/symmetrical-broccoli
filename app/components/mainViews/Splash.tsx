import React from "react"
import { Image } from "react-native"
import PrimaryColoredContainer from "@/components/layout/PrimaryColoredContainer"
import { ActivityIndicator } from "react-native-paper"

const Splash = () => {
    
    return <PrimaryColoredContainer>
        <>
            <Image source={require('@/assets/img/logo.jpeg')} style={{width: 200, height: 200}} />
            <ActivityIndicator size="large" color="#FFF"/>
        </>
    </PrimaryColoredContainer>
}

export default Splash