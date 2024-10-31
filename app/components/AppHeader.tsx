import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import { appBarsTitleFontSize } from "@/lib/utils"
import React, { useContext, useEffect } from "react"
import { Appbar, Icon } from "react-native-paper"
import { AppContext } from "./AppContextProvider"
import { primaryColor, lightPrimaryColor } from "./layout/constants"
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated"
import { AvatarIcon } from "./mainViews/AccountAvatar"
import Images from "@/Images"

const baseHeaderButtonSize = appBarsTitleFontSize * 0.75
const profileButtonSize = baseHeaderButtonSize * 1.5

const LoginButton = ({ size }:{ size: number }) => {
    const scale = useSharedValue(1)
    const rotate = useSharedValue(0)
    const tx = useSharedValue(0)
    const animatedStyles = useAnimatedStyle(() => ({
        transform: [{ scale: (scale.value)}, { rotate: `${rotate.value}deg` }, { translateX: tx.value }],
    }))

    useEffect(() => {
        tx.value = withRepeat(withSequence(withTiming(5, { duration: 250 }), withTiming(-5, { duration: 500 }), withTiming(0, { duration: 250 })), 10)
        scale.value = withRepeat(withSequence(withSpring(1.3, { duration: 500 }), withSpring(1, { duration: 500 })), 10),
        rotate.value = withRepeat(withSequence(withTiming(10, { duration: 250 }), withTiming(-10, { duration: 500 }), withTiming(0, { duration: 250 })), 10)
    }, [])

    return <Animated.View style={animatedStyles}>
        <Icon source={Images.NotConnected} size={size}/>
    </Animated.View>
}

interface AppHeaderProps {
    currentTabTitle: string,
    onProfileScreenRequested: () => void
    onSupportScreenRequested: () => void
}

const AppHeader = ({ currentTabTitle, onProfileScreenRequested, onSupportScreenRequested }: AppHeaderProps) => {
    const { ensureConnected } = useUserConnectionFunctions()
    const appContext = useContext(AppContext)

    return <Appbar.Header mode="center-aligned" style={{ backgroundColor: primaryColor } }>
        <Appbar.Action icon={p => <Images.Question />} style={{ backgroundColor: lightPrimaryColor }} size={baseHeaderButtonSize * 0.8} color="#000" onPress={onSupportScreenRequested} />
        <Appbar.Content title={currentTabTitle} titleStyle={{ fontWeight: '400', textTransform: 'uppercase', textAlign: 'center', fontSize: appBarsTitleFontSize, lineHeight: appBarsTitleFontSize }} />
        <Appbar.Action testID={appContext.account ? 'openProfile': 'openLoginScreen'} style={{ backgroundColor: appContext.account?.avatarPublicId ? 'transparent' : '#fff', height: profileButtonSize, width: profileButtonSize }} 
            icon={p => appContext.account ? <AvatarIcon account={appContext.account} size={p.size} /> : <LoginButton size={p.size} />} 
            size={ appContext.account ? profileButtonSize : baseHeaderButtonSize }
            centered
            borderless
            onPress={() => { 
                if(appContext.account) {
                    onProfileScreenRequested()
                } else {
                    ensureConnected('', '', () => {})
                }
            }} />
    </Appbar.Header>
}

export default AppHeader