import {DefaultTheme, NavigationContainer, NavigationHelpers, ParamListBase} from '@react-navigation/native'
import React from 'react'
import { Text, View } from 'react-native'
import Search from './Search'
import Chat from './Chat'
import EditResource from './EditResource'
import History from './History'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AppTabs from './AppTabs'
import { Box, HStack } from '@react-native-material/core'
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { t } from '../i18n'
import { primaryColor } from './layout/constants'
import EditProfile from './form/EditProfile'

const Tab = createBottomTabNavigator()
const StackNav = createNativeStackNavigator()

interface ScreenDescriptor { 
    title: string, 
    iconName: string, 
    component: Element
}

const screens: ScreenDescriptor[] = [
    { title: t('search_label'), iconName: 'search', component: Search },
    { title: t('history_label'), iconName: 'history', component: History },
    { title: t('resource_label'), iconName: 'edit', component: EditResource },
    { title: t('chat_label'), iconName: 'chat-bubble-outline', component: Chat },
]

interface ScreenHeaderProps {
    iconName: string,
    title: string
}

const ScreenHeader = ({ iconName, title }: ScreenHeaderProps) => <Box style={{ display: 'flex', flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
    <MaterialIcons size={30} name={iconName} />
    <Text style={{ fontSize: 24 }}>{title}</Text>
</Box>

const makeTabScreen = (screenDescriptor: ScreenDescriptor, key: any ) => <Tab.Screen key={key} name={screenDescriptor.title} component={screenDescriptor.component} options={{
    title: screenDescriptor.title,
    tabBarIcon: (props) => <MaterialIcons name={screenDescriptor.iconName} size={props.size}/>,
    headerTitleAlign: 'left',
    headerTitle: () => <ScreenHeader iconName={screenDescriptor.iconName} title={screenDescriptor.title} />
}}/>

const MainNavigation = ({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => <Tab.Navigator
    screenOptions={{ headerRight: () => <MaterialIcons.Button backgroundColor={primaryColor} onPress={() => {
        console.log('route', route, 'navigation', navigation)
        navigation.navigate('profile')
    }} size={30} name="account-circle" color="#000"/> }} tabBar={props => <AppTabs {...props} />} >
    { screens.map((screen, idx) => makeTabScreen(screen, idx)) }
</Tab.Navigator>

export default function Main () {
    return <NavigationContainer theme={{
        colors: {
            ...DefaultTheme.colors,
            card: primaryColor
        }, dark: false
    }}>
        <View style={{ flex: 1,alignItems: 'stretch', justifyContent: 'center', alignContent: 'stretch' }}>
            <StackNav.Navigator screenOptions={{ header: (props) => props.route.name === 'profile' ? <HStack items="center" style={{ backgroundColor: primaryColor, padding: 8 }}>
                    <MaterialIcons.Button color="#000" name="arrow-back" size={30} backgroundColor="transparent" onPress={() => props.navigation.goBack()} />
                    <Text style={{ fontSize: 24 }}>{t('profile_label')}</Text>
                </HStack> : <></> }}>
                <StackNav.Screen name="main" component={MainNavigation} key="main" />
                <StackNav.Screen name="profile" component={EditProfile} key="profile"  />
            </StackNav.Navigator>
        </View>
    </NavigationContainer>
}