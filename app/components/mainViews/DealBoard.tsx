import React, { useContext, useState } from "react"
import { Appbar, Avatar, Icon } from "react-native-paper"
import { lightPrimaryColor, primaryColor } from "@/components/layout/constants"
import { View } from "react-native"
import Search from './Search'
import Chat from './Chat'
import { t } from "@/i18n"
import Images from '@/Images'
import Resources from "./Resources"
import { RouteProps, appBarsTitleFontSize, initials } from "@/lib/utils"
import EditResourceContextProvider from "../resources/EditResourceContextProvider"
import SearchFilterContextProvider from "../SearchFilterContextProvider"
import { createMaterialBottomTabNavigator } from 'react-native-paper/react-navigation';
import { AppContext } from "../AppContextProvider"
import { urlFromPublicId } from "@/lib/images"

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
    const appContext = useContext(AppContext)

    if(!appContext.state.account) return <Icon source="login-variant" size={size}/>
    
    if(appContext.state.account!.avatarPublicId)
        return <Avatar.Image size={size} source={{ uri:urlFromPublicId(appContext.state.account!.avatarPublicId!) }} />

    return <Avatar.Text size={size} label={initials(appContext.state.account!.name)} />
}

const DealBoard = ({ route, navigation }: RouteProps) => {
    const appContext = useContext(AppContext)
    const [currentTabTitle, setCurrentTabTitle] = useState('')

    const profileButtonSize = appBarsTitleFontSize * 1.5

    return <EditResourceContextProvider>
        <SearchFilterContextProvider>
            <View style={{ flex: 1 }}>
                <Appbar.Header mode="center-aligned" style={{ backgroundColor: primaryColor } }>
                    <Appbar.Content title={currentTabTitle} titleStyle={{ fontWeight: '400', textTransform: 'uppercase', textAlign: 'center', fontSize: appBarsTitleFontSize, lineHeight: appBarsTitleFontSize }} />
                    <Appbar.Action style={{ backgroundColor: appContext.state.account?.avatarPublicId ? 'transparent' : '#fff', height: profileButtonSize, width: profileButtonSize }} 
                        icon={p => <ProfileIcon size={p.size} />} 
                        size={ appContext.state.account ? profileButtonSize : appBarsTitleFontSize }
                        centered
                        borderless
                        onPress={() => { 
                            if(appContext.state.account) {
                                navigation.navigate('profile')
                            } else {
                                appContext.actions.ensureConnected('', '', () => {
                                    
                                })
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
                    activeColor={ primaryColor }>
                    <Tab.Screen name="search" component={Search} options={{ title: t('search_label'), tabBarIcon: p => <Images.Search fill={p.color} /> }} />
                    <Tab.Screen name="resource" component={Resources} options={{ title: t('resource_label'), tabBarIcon: p => <Images.Modify fill={p.color} /> }} />
                    <Tab.Screen name="chat" component={Chat} options={{ title: t('chat_label'), tabBarIcon: p => <Images.Chat fill={p.color} />}} />
                </Tab.Navigator>
            </View>
        </SearchFilterContextProvider>
    </EditResourceContextProvider>
}

export default DealBoard