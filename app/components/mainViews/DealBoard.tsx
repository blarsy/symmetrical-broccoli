import React, { useState } from "react"
import { Appbar } from "react-native-paper"
import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { lightPrimaryColor, primaryColor } from "@/components/layout/constants"
import { View } from "react-native"
import Search from './Search'
import Chat from './Chat'
import { t } from "@/i18n"
import Images from '@/Images'
import Resources from "./Resources"
import { appBarsTitleFontSize } from "@/lib/utils"
import EditResourceContextProvider from "../EditResourceContextProvider"
import SearchFilterContextProvider from "../SearchFilterContextProvider"
import { createMaterialBottomTabNavigator } from 'react-native-paper/react-navigation';

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

const DealBoard = ({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => {
    const [currentTabTitle, setCurrentTabTitle] = useState('')

    return <EditResourceContextProvider>
        <SearchFilterContextProvider>
            <View style={{ flex: 1 }}>
                <Appbar.Header mode="center-aligned" style={{ backgroundColor: primaryColor } }>
                    <Appbar.Content title={currentTabTitle} titleStyle={{ fontWeight: '400', textTransform: 'uppercase', textAlign: 'center', fontSize: appBarsTitleFontSize, lineHeight: appBarsTitleFontSize }} />
                    <Appbar.Action style={{ backgroundColor: '#fff', borderRadius: 23 }} icon={Images.Profile} size={30} onPress={() => { navigation.navigate('profile')}} />
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