import React, { useState } from "react"
import { Appbar, BottomNavigation } from "react-native-paper"
import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { lightPrimaryColor, primaryColor } from "@/components/layout/constants"
import { View } from "react-native"
import Search from './Search'
import Chat from './Chat'
import EditResource from '@/components/EditResource'
import History from './History'
import { t } from "@/i18n"
import { IconSource } from "react-native-paper/lib/typescript/components/Icon"

const routes = [
    { key: 'search', title: t('search_label'), focusedIcon: ({ uri: require('/assets/LOUPE.svg') } as IconSource) },
    { key: 'history', title: t('history_label'), focusedIcon: ({ uri: require('/assets/HISTORY.svg') } as IconSource) },
    { key: 'resource', title: t('resource_label'), focusedIcon: ({ uri: require('/assets/PENCIL.svg') } as IconSource)  },
    { key: 'chat', title: t('chat_label'), focusedIcon: ({ uri: require('/assets/CHAT.svg') } as IconSource)  },
]

const DealBoard = ({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => {
    const [tabIndex, setTabIndex] = useState(0)
    return <View style={{ flex: 1 }}>
        <Appbar.Header style={{ backgroundColor: primaryColor} }>
            <Appbar.Content title={routes[tabIndex].title} titleStyle={{ fontSize: 24, fontFamily: 'DK-magical-brush', fontWeight: '400', textTransform: 'uppercase', textAlign: 'center' }} />
            <Appbar.Action style={{ backgroundColor: '#fff', borderRadius: 23 }} icon={{ uri: require('/assets/PROFIL.svg') } as IconSource} size={30} onPress={() => { navigation.navigate('profile')}} />
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