import React, { useContext, useEffect, useState } from "react"
import { Appbar, Icon } from "react-native-paper"
import { lightPrimaryColor, primaryColor } from "@/components/layout/constants"
import { View } from "react-native"
import Search from './Search'
import Chat from './Chat'
import { t } from "@/i18n"
import Images from '@/Images'
import Resources from "./Resources"
import { RouteProps, appBarsTitleFontSize } from "@/lib/utils"
import EditResourceContextProvider from "../resources/EditResourceContextProvider"
import SearchFilterContextProvider from "../SearchFilterContextProvider"
import { createMaterialBottomTabNavigator } from 'react-native-paper/react-navigation'
import { AppContext } from "../AppContextProvider"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"
import Animated, { useAnimatedStyle, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated"
import { useSharedValue } from 'react-native-reanimated'
import AccountAvatar from "./AccountAvatar"
import SupportModal from "../support/SupportModal"

const Tab = createMaterialBottomTabNavigator()

const getViewTitleI18n = (screenName: string): string => {
    switch(screenName) {
        case 'search':
            return t('search_label')
        case 'resource':
            return t('resource_label')
        case 'chat':
            return t('chat_label')
        default:
            return ''
    }
}

const ProfileIcon = ({ size}: { size: number }) => {
    const scale = useSharedValue(1)
    const rotate = useSharedValue(0)
    const tx = useSharedValue(0)
    const animatedStyles = useAnimatedStyle(() => ({
        transform: [{ scale: (scale.value)}, { rotate: `${rotate.value}deg` }, { translateX: tx.value }],
      }))
    const appContext = useContext(AppContext)

    useEffect(() => {
        tx.value = withRepeat(withSequence(withTiming(5, { duration: 250 }), withTiming(-5, { duration: 500 }), withTiming(0, { duration: 250 })), 10)
        scale.value = withRepeat(withSequence(withSpring(1.3, { duration: 500 }), withSpring(1, { duration: 500 })), 10),
        rotate.value = withRepeat(withSequence(withTiming(10, { duration: 250 }), withTiming(-10, { duration: 500 }), withTiming(0, { duration: 250 })), 10)
    }, [])

    if(!appContext.account) return <Animated.View style={animatedStyles}>
        <Icon source="account-question-outline" size={size}/>
    </Animated.View>

    return <AccountAvatar onPress={() => {}} account={appContext.account} size={size} />
}

const baseHeaderButtonSize = appBarsTitleFontSize * 0.75
const profileButtonSize = baseHeaderButtonSize * 1.5

const DealBoard = ({ route, navigation }: RouteProps) => {
    const appContext = useContext(AppContext)
    const [currentTabTitle, setCurrentTabTitle] = useState('')
    const { ensureConnected } = useUserConnectionFunctions()
    const [supportVisible, setSupportVisible] = useState(false)

    return <EditResourceContextProvider>
        <SearchFilterContextProvider>
            <View style={{ flex: 1 }}>
                <Appbar.Header mode="center-aligned" style={{ backgroundColor: primaryColor } }>
                    <Appbar.Content title={currentTabTitle} titleStyle={{ fontWeight: '400', textTransform: 'uppercase', textAlign: 'center', fontSize: appBarsTitleFontSize, lineHeight: appBarsTitleFontSize }} />
                    <Appbar.Action icon="help" style={{ backgroundColor: lightPrimaryColor }} size={baseHeaderButtonSize * 0.8} color="#000" onPress={() => { setSupportVisible(true )}} />
                    <Appbar.Action style={{ backgroundColor: appContext.account?.avatarPublicId ? 'transparent' : '#fff', height: profileButtonSize, width: profileButtonSize }} 
                        icon={p => <ProfileIcon size={p.size} />} 
                        size={ appContext.account ? profileButtonSize : baseHeaderButtonSize }
                        centered
                        borderless
                        onPress={() => { 
                            if(appContext.account) {
                                navigation.navigate('profile')
                            } else {
                                ensureConnected('', '', () => {})
                            }
                        }} />
                </Appbar.Header>
                <Tab.Navigator barStyle={{ backgroundColor: lightPrimaryColor }} 
                    theme={{ colors: { secondaryContainer: lightPrimaryColor }}}
                    screenListeners={{
                        state: e => {
                            if(e.data && (e.data as any).state) {
                                const state = (e.data as any).state
                                setCurrentTabTitle(getViewTitleI18n(state.routes[state.index].name))
                            }
                    }}}
                    activeColor={ primaryColor } inactiveColor="#000">
                    <Tab.Screen name="search" component={Search} options={{ title: t('search_label'), tabBarIcon: p => <Images.Search fill={p.color} /> }} />
                    <Tab.Screen name="resource" component={Resources} options={{ title: t('resource_label'), tabBarIcon: p => <Images.Modify fill={p.color} /> }} />
                    <Tab.Screen name="chat" component={Chat} options={{ title: t('chat_label'), tabBarIcon: p => <Images.Chat fill={p.color} />}} />
                </Tab.Navigator>
                <SupportModal visible={supportVisible} onDismiss={() => setSupportVisible(false)} />
            </View>
        </SearchFilterContextProvider>
    </EditResourceContextProvider>
}

export default DealBoard