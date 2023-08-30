import {DefaultTheme, NavigationContainer} from '@react-navigation/native'
import React, { useState } from 'react'
import { Modal, Text, View } from 'react-native'
import Search from './Search'
import Chat from './Chat'
import EditResource from './EditResource'
import History from './History'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import AppTabs from './AppTabs'
import { Box, Stack } from '@react-native-material/core'
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { Menu, MenuItem } from 'react-native-material-menu'
import { t } from '../i18n'
import EditProfile from './form/EditProfile'
import { primaryColor } from './layout/constants'

const Tab = createBottomTabNavigator()

const screens: { title: string, iconName: string, component: Element}[] = [
    { title: t('search_label'), iconName: 'search', component: Search },
    { title: t('history_label'), iconName: 'history', component: History },
    { title: t('resource_label'), iconName: 'edit', component: EditResource },
    { title: t('chat_label'), iconName: 'chat-bubble-outline', component: Chat },
]

export default function Main () {
    const [menuItem, setMenuItem] = useState({visible: false, selected: ''})
    return <NavigationContainer theme={{
        colors: {
            ...DefaultTheme.colors,
            card: primaryColor
        }, dark: false
    }}>
        <View style={{ flex: 1,alignItems: 'stretch', justifyContent: 'center', alignContent: 'stretch' }}>
            <Tab.Navigator screenOptions={{ headerRight: () => <Menu visible={menuItem.visible} 
                    anchor={<MaterialIcons.Button backgroundColor={primaryColor} color="#000" onPress={() => setMenuItem({ visible: true, selected: '' })} size={30} name="account-circle" />}
                    onRequestClose={() => setMenuItem({ visible: false, selected: '' })} >
                    <MenuItem onPress={() => {
                        setMenuItem({ visible: false, selected: 'profile' })
                    }} >{t('editProfileMenuTitle')}</MenuItem>
                    <MenuItem onPress={() => {
                        setMenuItem({ visible: false, selected: 'network' })
                    }} >{t('friendsMenuTitle')}</MenuItem>
                </Menu>}}
                tabBar={props => <AppTabs {...props} />} >
                { screens.map((screen, idx) => <Tab.Screen key={idx} name={screen.title} component={screen.component} options={{
                    title: screen.title, 
                    tabBarIcon: (props) => <MaterialIcons name={screen.iconName} color={props.color} size={props.size}/>,
                    headerTitleAlign: 'left',
                    headerTitle: () => <Box style={{ display: 'flex', flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                        <MaterialIcons size={30} name={screen.iconName} />
                        <Text style={{ fontSize: 24 }}>{screen.title}</Text>
                    </Box>
                }}/>) }
            </Tab.Navigator>
            <Modal visible={!!menuItem.selected}>
                <Stack style={{ margin: 4 }}>
                    <Box>
                        <MaterialIcons.Button size={30} color="#000" backgroundColor="transparent" name="close" onPress={() => {
                            setMenuItem({ visible: false, selected: '' })
                        }} />
                    </Box>
                    {menuItem.selected === 'profile' && <EditProfile />}
                    {menuItem.selected === 'network' && <Text>NETWORK</Text>}
                </Stack>
            </Modal>
        </View>
    </NavigationContainer>
}