import React, { useEffect, useState } from "react"
import { Appbar, BottomNavigation } from "react-native-paper"
import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { lightPrimaryColor, primaryColor } from "@/components/layout/constants"
import { View } from "react-native"
import Search from './Search'
import Chat from './Chat'
import EditResource from '@/components/EditResource'
import MyNetwork from "@/components/MyNetwork"
import History from './History'
import { t } from "@/i18n"
import Images from '@/Images'

const routes = [
    { key: 'search', title: t('search_label'), focusedIcon: Images.Search },
    { key: 'resource', title: t('resource_label'), focusedIcon: Images.Modify },
    { key: 'chat', title: t('chat_label'), focusedIcon: Images.Chat },
    { key: 'myNetwork', title: t('network_label'), focusedIcon: 'account-multiple-check-outline' },
    { key: 'history', title: t('history_label'), focusedIcon: Images.History },
]

export let navigateMainStack: (viewName: string) => void

const DealBoard = ({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => {
    const [tabIndex, setTabIndex] = useState(0)
    
    useEffect(() => {
        //register a method on the context to navigate to a view on the StackNavigator
        navigateMainStack = viewName => navigation.navigate(viewName)
    })

    return <View style={{ flex: 1 }}>
        <Appbar.Header style={{ backgroundColor: primaryColor} }>
            <Appbar.Content title={routes[tabIndex].title} titleStyle={{ fontSize: 24, fontFamily: 'DK-magical-brush', fontWeight: '400', textTransform: 'uppercase', textAlign: 'center' }} />
            <Appbar.Action style={{ backgroundColor: '#fff', borderRadius: 23 }} icon={Images.Profile} size={30} onPress={() => { navigation.navigate('profile')}} />
        </Appbar.Header>
        <BottomNavigation onIndexChange={setTabIndex} barStyle={{ backgroundColor: lightPrimaryColor }} 
            renderScene={BottomNavigation.SceneMap({
                search: Search,
                history: History,
                resource: EditResource,
                chat: Chat,
                myNetwork: MyNetwork,
              })} activeColor={primaryColor}
            navigationState={{ index: tabIndex, routes }}/>
    </View>
}

export default DealBoard