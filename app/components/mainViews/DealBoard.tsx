import React, { ReactNode, useState } from "react"
import { Appbar, BottomNavigation } from "react-native-paper"
import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { lightPrimaryColor, primaryColor } from "@/components/layout/constants"
import { ScrollView, Text, View } from "react-native"
import Search from './Search'
import Chat from './Chat'
import MyNetwork from "@/components/MyNetwork"
import History from './History'
import { t } from "@/i18n"
import Images from '@/Images'
import Resources from "./Resources"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { RouteProps } from "@/lib/utils"
import EditResource from "../form/EditResource"
import Connections from "../Connections"
import AddFriend from "../AddFriend"
import RequestsReceived from "../RequestsReceived"
import RequestsSent from "../RequestsSent"
import EditCondition from "../form/EditCondition"
import ViewResource from "../ViewResource"
import EditResourceContextProvider from "../EditResourceContextProvider"
import { SvgProps } from "react-native-svg"

const StackNav = createNativeStackNavigator()

const getViewTitleI18n = (routeName: string) => {
    switch(routeName) {
        case 'newResource':
            return 'newResource_viewTitle'
        case 'viewResource':
            return 'viewResource_viewTitle'
        case 'editResource':
            return 'editResource_viewTitle'
        case 'addFriend':
            return 'newFriend_viewTitle'
        case 'connections':
            return 'myNetwork_title'
        case 'requestsReceived':
            return 'requestsReceived_title'
        case 'requestsSent':
            return 'requestsSent_title'
        case 'editCondition':
            return 'editCondition_title'
        case 'addCondition':
            return 'addCondition_title'
        default:
            return ''
    }
}

const bottomRoutes = [
    { key: 'search', title: t('search_label'), focusedIcon: Images.Search },
    { key: 'resource', title: t('resource_label'), focusedIcon: Images.Modify },
    { key: 'chat', title: t('chat_label'), focusedIcon: Images.Chat },
    //{ key: 'myNetwork', title: t('network_label'), focusedIcon: 'account-multiple-check-outline' },
    { key: 'history', title: t('history_label'), focusedIcon: Images.History },
]

const DealBoard = ({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => {
    const [tabIndex, setTabIndex] = useState(0)

    return <EditResourceContextProvider>
        <View style={{ flex: 1 }}>
            <Appbar.Header style={{ backgroundColor: primaryColor} }>
                <Appbar.Content title={bottomRoutes[tabIndex].title} titleStyle={{ fontSize: 24, fontFamily: 'DK-magical-brush', fontWeight: '400', textTransform: 'uppercase', textAlign: 'center' }} />
                <Appbar.Action style={{ backgroundColor: '#fff', borderRadius: 23 }} icon={Images.Profile} size={30} onPress={() => { navigation.navigate('profile')}} />
            </Appbar.Header>
            <StackNav.Navigator screenOptions={{ header: props => props.route.name != 'dealMain' && <Appbar.Header style={{ backgroundColor: lightPrimaryColor }}>
                <Appbar.BackAction onPress={() => props.navigation.goBack()} />
                <Appbar.Content titleStyle={{ fontSize: 20, fontFamily: 'DK-magical-brush', textTransform: 'uppercase' }} title={t(getViewTitleI18n(props.route.name))} />
            </Appbar.Header> }}>
                <StackNav.Screen name="dealMain" key="dealMain">
                    {(props: RouteProps) => <BottomNavigation onIndexChange={setTabIndex}
                        barStyle={{ backgroundColor: lightPrimaryColor }} 
                        renderScene={
                            BottomNavigation.SceneMap({
                                search: Search,
                                history: History,
                                resource: () => <Resources {...props} />,
                                chat: Chat,
                                myNetwork: () => <ScrollView><MyNetwork {...props} /></ScrollView>,
                            })
                        }
                        activeColor={primaryColor}
                        navigationState={{ index: tabIndex, routes: bottomRoutes }} />}
                </StackNav.Screen>
                <StackNav.Screen name="resourcesMain" key="resourcesMain"
                    component={Resources} />
                <StackNav.Screen name="newResource" key="newResource"
                    component={EditResource} initialParams={{isNew: true}}/>
                <StackNav.Screen name="viewResource" key="viewResource"
                    component={ViewResource} />
                <StackNav.Screen name="editResource" key="editResource"
                    component={EditResource} />
                <StackNav.Screen name="networkMain" component={MyNetwork} key="networkMain" />
                <StackNav.Screen initialParams={{ icon: <Images.Heart style={{ margin: 10 }} width={30} height={30} /> }} name="connections" component={Connections} key="connections" />
                <StackNav.Screen name="addFriend" component={AddFriend} key="addFriend" />
                <StackNav.Screen initialParams={{ icon: <Images.Received style={{ margin: 10 }} width={30} height={30} /> }} name="requestsReceived" component={RequestsReceived} key="requestsReceived" />
                <StackNav.Screen initialParams={{ icon: <Images.Sent style={{ margin: 10 }} width={30} height={30} /> }} name="requestsSent" component={RequestsSent} key="requestsSent" />
                <StackNav.Screen name="editCondition" component={EditCondition} />
                <StackNav.Screen name="addCondition" component={EditCondition} />
            </StackNav.Navigator>
        </View>
    </EditResourceContextProvider>
}

export default DealBoard