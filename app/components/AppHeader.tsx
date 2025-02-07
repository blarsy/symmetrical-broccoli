import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import { appBarsTitleFontSize } from "@/lib/utils"
import React, { ReactNode, useContext, useEffect } from "react"
import { Appbar, Icon, Text } from "react-native-paper"
import { AppContext } from "./AppContextProvider"
import { primaryColor, lightPrimaryColor } from "./layout/constants"
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated"
import { AvatarIcon } from "./mainViews/AccountAvatar"
import Images from "@/Images"
import { TouchableOpacity, View } from "react-native"

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


interface TokenCounterProps {
    amountOfTokens: number
    size: number
    onPress: () => void
}

const TokenCounter = (p: TokenCounterProps) => <TouchableOpacity testID="TokenCounter" onPress={p.onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
    <Images.Tokens width={p.size} height={p.size} fill={lightPrimaryColor}/>
    <Text testID="TokenCounter:AmountOfTokens" variant="displayMedium" style={{ color: '#fff' }}>X{p.amountOfTokens}</Text>
</TouchableOpacity>

interface AppHeaderProps {
    currentTabTitle: string,
    onProfileScreenRequested: () => void
    onSupportScreenRequested: () => void
    onTokenCounterPressed: () => void
}

const AppHeader = ({ currentTabTitle, onProfileScreenRequested, onSupportScreenRequested, onTokenCounterPressed }: AppHeaderProps) => {
    const { ensureConnected } = useUserConnectionFunctions()
    const appContext = useContext(AppContext)

    const supportAction = <Appbar.Action key="support" icon={p => <Images.Question fill={primaryColor} />} style={{ backgroundColor: lightPrimaryColor }} 
        size={baseHeaderButtonSize * 0.8} color="#000" onPress={onSupportScreenRequested} />
    const barContent = <Appbar.Content key="content" title={currentTabTitle} 
        titleStyle={{ fontWeight: '400', textTransform: 'uppercase', textAlign: 'center', 
            fontSize: appBarsTitleFontSize, lineHeight: appBarsTitleFontSize }} />
    const profileAction = <Appbar.Action key="profile" testID={appContext.account ? 'openProfile': 'openLoginScreen'} 
        style={{ backgroundColor: appContext.account?.avatarPublicId ? 'transparent' : '#fff', 
            height: profileButtonSize, width: profileButtonSize }} 
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

    const components: ReactNode[] = []

    if(appContext.account?.willingToContribute) {
        components.push(
            <TokenCounter key="counter" onPress={onTokenCounterPressed} size={50} amountOfTokens={appContext.account!.amountOfTokens}/>, 
            barContent, supportAction, profileAction)
    } else {
        components.push(supportAction, barContent, profileAction)
    }


    return <Appbar.Header mode="center-aligned" style={{ backgroundColor: primaryColor } }>{ components }</Appbar.Header>
}

export default AppHeader