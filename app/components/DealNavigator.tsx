import React, { ReactNode, useState } from 'react'
import { lightPrimaryColor, primaryColor } from "./layout/constants"
import { t } from '@/i18n'
import { TabNavigatorProps } from '@/lib/TabNavigatorProps'
import { BottomNavigation, Icon } from 'react-native-paper'
import { BaseRoute } from 'react-native-paper/lib/typescript/components/BottomNavigation/BottomNavigation'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'

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
        case 'bids':
            return t('bids_label')
        default:
            return ''
    }
}

const Tab = createBottomTabNavigator()

interface DealNavigatorProps {
    tabs: TabNavigatorProps[]
    onTabSelected: (title: string) => void
}

const DealNavigator = (p: DealNavigatorProps) => {
    const [index, setIndex] = useState(0)
    const routes = p.tabs.map(tb => ({
        key: tb.name, name: tb.name, title: getViewTitleI18n(tb.name).toUpperCase(), focusedIcon: tb.options?.tabBarIcon,
    } as BaseRoute))

    return <Tab.Navigator screenOptions={() => ({ headerShown: false })} tabBar={({ navigation, state, descriptors, insets }) => 
        <BottomNavigation.Bar
            activeColor={ primaryColor } inactiveColor="#000" 
            navigationState={{ index, routes }} style={{ backgroundColor: lightPrimaryColor }}
            onTabPress={ptp => {
                setIndex(p.tabs.findIndex(t => t.name === ptp.route.key))
                navigation.navigate(ptp.route.key)
            }} />} 
        screenListeners={{
            state: e => {
                if(e.data && (e.data as any).state) {
                    const state = (e.data as any).state
                    p.onTabSelected(getViewTitleI18n(state.routes[state.index].name))
                }
        }}}>
        { p.tabs.map(t => <Tab.Screen key={t.name} name={t.name} component={t.component} options={t.options} />) }
    </Tab.Navigator>
}

export default DealNavigator