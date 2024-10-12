import React, { ReactNode } from 'react'
import { RouteProps } from "@/lib/utils"
import { RouteProp, ParamListBase } from "@react-navigation/native"
import { MaterialBottomTabNavigationOptions } from "react-native-paper"
import { lightPrimaryColor, primaryColor } from "./layout/constants"
import { createMaterialBottomTabNavigator } from 'react-native-paper/react-navigation'
import { t } from '@/i18n'

const Tab = createMaterialBottomTabNavigator()

const getViewTitleI18n = (screenName: string): string => {
    switch(screenName) {
        case 'search':
            return t('search_label')
        case 'resource':
            return t('resource_label')
        case 'chat':
            return t('chat_label')
        case 'notifications':
            return t('notifications_title')
        default:
            return ''
    }
}

export interface TabNavigatorProps {
    name: string
    component: (r: RouteProps) => ReactNode
    options?: MaterialBottomTabNavigationOptions | ((props: {
        route: RouteProp<ParamListBase, string>
        navigation: any
    }) => MaterialBottomTabNavigationOptions)
}

interface DealNavigatorProps {
    tabs: TabNavigatorProps[]
    onTabSelected: (title: string) => void
}

const DealNavigator = (p: DealNavigatorProps) => {
    return <Tab.Navigator barStyle={{ backgroundColor: lightPrimaryColor }} 
        theme={{ colors: { secondaryContainer: lightPrimaryColor }}}
        screenListeners={{
            state: e => {
                if(e.data && (e.data as any).state) {
                    const state = (e.data as any).state
                    p.onTabSelected(getViewTitleI18n(state.routes[state.index].name))
                }
        }}}
        activeColor={ primaryColor } inactiveColor="#000">
        { p.tabs.map((tabData, idx) => <Tab.Screen key={idx} name={tabData.name} component={tabData.component} options={tabData.options} />) }
    </Tab.Navigator>
}

export default DealNavigator