import {DefaultTheme, NavigationContainer } from '@react-navigation/native'
import React from 'react'
import { View } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { t } from '@/i18n'
import { primaryColor } from '@/components/layout/constants'
import Profile from './Profile'
import DealBoard from './DealBoard'
import { Appbar } from 'react-native-paper'

const StackNav = createNativeStackNavigator()

const getViewTitleI18n = (viewName: string) => {
    switch (viewName) {
        case 'profile': return 'profile_label'
        default: return ''
    }
}

export default function Main () {
    return <NavigationContainer theme={{
        colors: {
            ...DefaultTheme.colors,
            card: primaryColor
        }, dark: false
    }}>
        <View style={{ flex: 1,alignItems: 'stretch', justifyContent: 'center', alignContent: 'stretch' }}>
            <StackNav.Navigator screenOptions={{ header: (props) => props.route.name != 'main' && <Appbar.Header style={{ backgroundColor: primaryColor }}>
                    <Appbar.BackAction onPress={() => props.navigation.goBack()} />
                    <Appbar.Content titleStyle={{ fontSize: 24, fontFamily: 'DK-magical-brush', textTransform: 'uppercase', fontWeight: '400', textAlign: 'center' }} title={t(getViewTitleI18n(props.route.name))} />
                </Appbar.Header> }}>
                <StackNav.Screen name="main" component={DealBoard} key="main" />
                <StackNav.Screen name="profile" component={Profile} key="profile"  />
            </StackNav.Navigator>
        </View>
    </NavigationContainer>
}