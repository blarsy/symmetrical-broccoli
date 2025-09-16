import React, { useContext, useState } from "react"
import { Badge, Icon } from "react-native-paper"
import { primaryColor } from "@/components/layout/constants"
import { View } from "react-native"
import Search from './Search'
import Chat from './Chat'
import { t } from "@/i18n"
import Images from '@/Images'
import Resources from "./Resources"
import { RouteProps } from "@/lib/utils"
import EditResourceContextProvider from "../resources/EditResourceContextProvider"
import SearchFilterContextProvider from "../SearchFilterContextProvider"
import { AppContext } from "../AppContextProvider"
import SupportModal from "../support/SupportModal"
import Notifications from "../notifications/Notifications"
import DealNavigator from "../DealNavigator"
import AppHeader from "../AppHeader"
import { TabNavigatorProps } from "@/lib/TabNavigatorProps"
import Bids from "./Bids"

export interface DealBoardProps extends RouteProps {
    tabs?: TabNavigatorProps[]
}

const DealBoard = ({ route, navigation, tabs }: DealBoardProps) => {
    const appContext = useContext(AppContext)
    const [currentTabTitle, setCurrentTabTitle] = useState('')
    const [supportVisible, setSupportVisible] = useState(false)

    return <EditResourceContextProvider>
        <SearchFilterContextProvider>
            <View style={{ flex: 1 }}>
                <AppHeader currentTabTitle={currentTabTitle} 
                    onProfileScreenRequested={() => navigation.navigate('profile')}
                    onSupportScreenRequested={() => setSupportVisible(true )}
                    onTokenCounterPressed={() => navigation.navigate('profile',  { screen: 'tokens'  }) }/>
                <DealNavigator onTabSelected={setCurrentTabTitle} tabs={tabs || [{
                    name: 'search', component: Search, options: { title: t('search_label').toUpperCase(), tabBarIcon: p => <Images.Search fill={p.color} /> }
                }, {
                    name: 'resource', component: Resources, options: { title: t('resource_label').toUpperCase(), tabBarIcon: p => <Images.Modify fill={p.color} /> }
                }, {
                    name: 'bids', component: Bids, options: { tabBarButtonTestID: 'bottomBar:Bids', title: t('bids_label').toUpperCase(), tabBarIcon: p => <Icon source="hand-coin" color={p.color} size={32} /> }
                }, {
                    name: 'chat', component: Chat, options: { tabBarButtonTestID: 'bottomBar:Chat', title: t('chat_label').toUpperCase(), tabBarIcon: p => <>
                        <Images.Chat fill={p.color} />
                        { appContext.unreadConversations.length != 0 && <Badge testID="chatUnreads" style={{ position: 'absolute', backgroundColor: primaryColor, top: -8, right: -8 }}>{appContext.unreadConversations.length}</Badge>}
                    </> }
                }, {
                    name: 'notifications', component: Notifications, options: { tabBarButtonTestID: 'bottomBar:Notifications', title: t('notifications_label').toUpperCase(), tabBarIcon: p => <>
                        <Images.Bell fill={p.color}/>
                        { appContext.unreadNotifications.length != 0 && <Badge testID="notificationUnreads" style={{ position: 'absolute', backgroundColor: primaryColor, top: -8, right: -8 }}>{appContext.unreadNotifications.length}</Badge>}
                    </> }
                } ]} />
                <SupportModal visible={supportVisible} onDismiss={() => setSupportVisible(false)} />
            </View>
        </SearchFilterContextProvider>
    </EditResourceContextProvider>
}

export default DealBoard