import {NavigationContainer} from '@react-navigation/native'
import React from 'react'
import { Text, View } from 'react-native'
import Search from './Search'
import Profile from './Profile'
import Chat from './Chat'
import EditResource from './EditResource'
import History from './History'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import AppTabs from './AppTabs'
import { IconComponentProvider, Icon, Box } from '@react-native-material/core'
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { t } from '../i18n'

const Tab = createBottomTabNavigator()

const screens: { title: string, iconName: string, component: Element}[] = [
    { title: t('search_label'), iconName: 'search', component: Search },
    { title: t('history_label'), iconName: 'history', component: History },
    { title: t('resource_label'), iconName: 'edit', component: EditResource },
    { title: t('chat_label'), iconName: 'chat-bubble-outline', component: Chat },
    { title: t('profile_label'), iconName: 'account-circle', component: Profile },
]

export default function Main () {
    return <NavigationContainer>
        <View style={{ flex: 1, backgroundColor: '#fff', alignItems: 'stretch', justifyContent: 'center', alignContent: 'stretch' }}>
            <IconComponentProvider IconComponent={MaterialIcons}>
                <Tab.Navigator tabBar={props => <AppTabs {...props} />} >
                    { screens.map((screen, idx) => <Tab.Screen key={idx} name={screen.title} component={screen.component} options={{
                        title: screen.title, 
                        tabBarIcon: () => <Icon size={30} name={screen.iconName} />,
                        headerTitleAlign: 'center',
                        headerTitle: () => <Box style={{ display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                            <Icon size={30} name={screen.iconName} />
                            <Text style={{ fontSize: 24 }}>{screen.title}</Text>
                        </Box>
                    }}/>) }
                </Tab.Navigator>
            </IconComponentProvider>
        </View>
    </NavigationContainer>
}