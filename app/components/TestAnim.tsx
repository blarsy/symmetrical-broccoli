import React, { useEffect, useRef } from "react"
import { View } from "react-native"
import LottieView from 'lottie-react-native'
import { Button } from "react-native-paper";

export default () => {
    const animation = useRef<LottieView>(null)
    
    return <View>
        <LottieView
            autoPlay
            loop={false}
            ref={animation}
            style={{
                width: 200,
                height: 200,
                backgroundColor: '#eee',
            }}
            // Find more Lottie files at https://lottiefiles.com/featured
            source={require('../assets/camera.json')}
        />
        <Button
            onPress={() => {
                animation.current?.reset();
                animation.current?.play();
            }}
        >Restart Animation</Button>
    </View>
}