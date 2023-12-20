import {DefaultTheme, NavigationContainer } from '@react-navigation/native'
import React, { useContext } from 'react'
import { View } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { t } from '@/i18n'
import { primaryColor } from '@/components/layout/constants'
import Profile from './Profile'
import DealBoard from './DealBoard'
import { Appbar } from 'react-native-paper'
import Container from '../layout/Container'
import { appBarsTitleFontSize } from '@/lib/utils'
import { AppContext } from '../AppContextProvider'

const StackNav = createNativeStackNavigator()

const getViewTitleI18n = (viewName: string) => {
    switch (viewName) {
        case 'profile': return 'profile_label'
        default: return ''
    }
}

export default function Main () {
    const appContext = useContext(AppContext)
    return <Container style={{ flexDirection: 'column' }}>
        <NavigationContainer theme={{
            colors: {
                ...DefaultTheme.colors,
                card: primaryColor
            }, dark: false
        }}>
            <View style={{ flex: 1,alignItems: 'stretch', alignSelf: 'stretch', justifyContent: 'center', alignContent: 'stretch' }}>
                <StackNav.Navigator screenOptions={{ header: (props) => <Appbar.Header mode="center-aligned" style={{ backgroundColor: primaryColor }}>
                        <Appbar.BackAction onPress={() => props.navigation.goBack()} />
                        <Appbar.Content titleStyle={{ textTransform: 'uppercase', fontWeight: '400', fontSize: appBarsTitleFontSize, lineHeight: appBarsTitleFontSize }} title={t(getViewTitleI18n(props.route.name))}  />
                        <Appbar.Action icon="logout" size={appBarsTitleFontSize} color="#000" onPress={() => appContext.actions.logout()} />
                    </Appbar.Header> }}>
                    <StackNav.Screen name="main" component={DealBoard} key="main" options={{ headerShown: false }} />
                    <StackNav.Screen name="profile" component={Profile} key="profile"  />
                </StackNav.Navigator>
            </View>
        </NavigationContainer>
    </Container>
}