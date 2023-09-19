import {DefaultTheme, NavigationContainer } from '@react-navigation/native'
import React from 'react'
import { Text, View } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { t } from '@/i18n'
import { primaryColor } from '@/components/layout/constants'
import Profile from './Profile'
import DealBoard from './DealBoard'

const StackNav = createNativeStackNavigator()

const getViewTitleI18n = (viewName: string) => {
    switch (viewName) {
        case 'profile': return 'profile_label'
        case 'newFriend': return 'newFriend_viewTitle'
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
            <StackNav.Navigator screenOptions={{ header: (props) => props.route.name != 'main' && <View style={{ flex:1, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', backgroundColor: primaryColor, padding: 8 }}>
                    <MaterialIcons.Button color="#000" name="arrow-back" size={30} backgroundColor="transparent" onPress={() => props.navigation.goBack()} />
                    <Text style={{ fontSize: 24, fontFamily: 'DK-magical-brush', textTransform: 'uppercase', fontWeight: '400', textAlign: 'center', flex: 1 }}>{t(getViewTitleI18n(props.route.name))}</Text>
                </View> }}>
                <StackNav.Screen name="main" component={DealBoard} key="main" />
                <StackNav.Screen name="profile" component={Profile} key="profile"  />
            </StackNav.Navigator>
        </View>
    </NavigationContainer>
}