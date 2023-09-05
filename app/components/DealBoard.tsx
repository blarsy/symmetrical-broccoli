import React, { useState } from "react"
import { Appbar, BottomNavigation, Text } from "react-native-paper"
import MaterialIcons from "@expo/vector-icons/MaterialIcons"
import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { lightPrimaryColor, primaryColor } from "./layout/constants"
import { View } from "react-native"
import Search from './Search'
import Chat from './Chat'
import EditResource from './EditResource'
import History from './History'
import { t } from "../i18n"

const routes = [
    { key: 'search', title: t('search_label'), focusedIcon: (props: any) => <MaterialIcons name="search" {...props}/>},
    { key: 'history', title: t('history_label'), focusedIcon: (props: any) => <MaterialIcons name="history" {...props}/> },
    { key: 'resource', title: t('resource_label'), focusedIcon: (props: any) => <MaterialIcons name="edit" {...props}/> },
    { key: 'chat', title: t('chat_label'), focusedIcon: (props: any) => <MaterialIcons name="chat-bubble-outline" {...props}/> },
]

const DealBoard = ({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => {
    const [tabIndex, setTabIndex] = useState(0)
    return <View style={{ flex: 1 }}>
        <Appbar.Header style={{ backgroundColor: primaryColor} }>
            <Appbar.Content title={routes[tabIndex].title} />
            <Appbar.Action icon={() => <MaterialIcons name="account-circle" size={30}/>} onPress={() => { navigation.navigate('profile')}} />
        </Appbar.Header>
        <BottomNavigation onIndexChange={setTabIndex} barStyle={{ backgroundColor: lightPrimaryColor }} 
            renderScene={BottomNavigation.SceneMap({
                search: Search,
                history: History,
                resource: EditResource,
                chat: Chat,
              })} activeColor={primaryColor}
            navigationState={{ index: tabIndex, routes }}/>
    </View>
}

export default DealBoard