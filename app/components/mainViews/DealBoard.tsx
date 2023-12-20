import React, { useContext, useEffect, useState } from "react"
import { Appbar, BottomNavigation, Button, Icon, IconButton, List, Portal, Snackbar, Text } from "react-native-paper"
import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { lightPrimaryColor, primaryColor } from "@/components/layout/constants"
import { ScrollView, View } from "react-native"
import Search from './Search'
import Chat from './Chat'
import MyNetwork from "@/components/MyNetwork"
import History from './History'
import { t } from "@/i18n"
import Images from '@/Images'
import Resources from "./Resources"
import { NativeStackHeaderProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { NewMessageData, RouteProps, ScreenSize, adaptHeight, appBarsTitleFontSize, getScreenSize } from "@/lib/utils"
import EditResource from "../form/EditResource"
import Connections from "../Connections"
import AddFriend from "../AddFriend"
import RequestsReceived from "../RequestsReceived"
import RequestsSent from "../RequestsSent"
import ViewResource from "../ViewResource"
import EditResourceContextProvider from "../EditResourceContextProvider"
import { Resource } from "@/lib/schema"
import { ResourceImage } from "../MainResourceImage"
import { fontSizeMedium } from "./Start"
import { AppContext } from "../AppContextProvider"
import ListOf from "../ListOf"
import { getResource } from "@/lib/api"
import SearchFilterContextProvider from "../SearchFilterContextProvider"
const StackNav = createNativeStackNavigator()

interface ChatHeaderProps {
    headerProps: NativeStackHeaderProps
}

const ChatHeader = (p: ChatHeaderProps) => {
    const resource: Resource = (p.headerProps.route.params! as any).resource
    const exchangeTypes: string[] = []
    if(resource.canBeGifted) exchangeTypes.push(t('canBeGifted_label'))
    if(resource.canBeExchanged) exchangeTypes.push(t('canBeExchanged_label'))
    return (<View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <ResourceImage size={70} resource={resource} />
        <View style={{ flexDirection: 'column', padding: 6, gap: 2 }}>
            <Text variant="headlineMedium" style={{ color: primaryColor, textTransform: 'uppercase' }}><Icon size={fontSizeMedium} color={primaryColor} source="account-circle" /> {resource.account!.name}</Text>
            <Text variant="headlineMedium" style={{ textTransform: 'uppercase' }}>{resource.title}</Text>
            <Text variant="headlineMedium" style={{ color: primaryColor, textTransform: 'uppercase' }}>{exchangeTypes.join('/')}</Text>
        </View>
    </View>)
}

const simpleBackHeader = (props: NativeStackHeaderProps) => <View style={{ flexDirection: 'row', backgroundColor: '#fff' }}>
 <Button textColor={primaryColor} icon={p => <Icon size={p.size} source="chevron-left" color={p.color} /> } onPress={() => props.navigation.goBack() }>{t('back_label')}</Button>
</View>

const getViewTitleI18n = (headerProps: NativeStackHeaderProps): React.ReactNode | string => {
    switch(headerProps.route.name) {
        case 'newResource':
            return t('newResource_viewTitle')
        case 'viewResource':
            return t('viewResource_viewTitle')
        case 'editResource':
            return t('editResource_viewTitle')
        case 'addFriend':
            return t('newFriend_viewTitle')
        case 'connections':
            return t('myNetwork_title')
        case 'requestsReceived':
            return t('requestsReceived_title')
        case 'requestsSent':
            return t('requestsSent_title')
        case 'chat':
            return <ChatHeader headerProps={headerProps} />
        default:
            return ''
    }
}

const makeBottomRoutes = (numberOfUnreads: number) => [
    { key: 'search', title: t('search_label'), focusedIcon: Images.Search },
    { key: 'resource', title: t('resource_label'), focusedIcon: Images.Modify },
    { key: 'chat', title: t('chat_label'), focusedIcon: Images.Chat, badge: numberOfUnreads > 0 ? numberOfUnreads : undefined},
    // { key: 'history', title: t('history_label'), focusedIcon: Images.History },
]

const DealBoard = ({ route, navigation }: { route: any, navigation: NavigationHelpers<ParamListBase>}) => {
    const appContext = useContext(AppContext)
    const [tabIndex, setTabIndex] = useState(0)
    const [newMessages, setNewMessages] = useState([] as NewMessageData[])

    const appBarHeaderHeight = getScreenSize() != ScreenSize.sm ? 90 : 75

    const bottomRoutes = makeBottomRoutes(appContext.state.numberOfUnread)

    useEffect(() => {
        appContext.state.chatSocket!.pushStackChatMessageListener((data: NewMessageData) => {
            if(data.message.from.id != appContext.state.account?.id)  {
                //Display snackbar
                setNewMessages([ data, ...newMessages ])
            }
        })
        return () => { appContext.state.chatSocket!.popStackChatMessageListener() }
    }, [])

    return <EditResourceContextProvider>
        <SearchFilterContextProvider>
            <View style={{ flex: 1 }}>
                <Appbar.Header mode="center-aligned" style={{ backgroundColor: primaryColor } }>
                    <Appbar.Content title={bottomRoutes[tabIndex].title} titleStyle={{ fontWeight: '400', textTransform: 'uppercase', textAlign: 'center', fontSize: appBarsTitleFontSize }} />
                    <Appbar.Action style={{ backgroundColor: '#fff', borderRadius: 23 }} icon={Images.Profile} size={30} onPress={() => { navigation.navigate('profile')}} />
                </Appbar.Header>
                <StackNav.Navigator
                    screenOptions={{ header: props => props.route.name != 'dealMain' && <Appbar.Header mode="center-aligned" statusBarHeight={0} style={{ backgroundColor: lightPrimaryColor, height: appBarHeaderHeight }}>
                    <Appbar.BackAction onPress={() => props.navigation.goBack()} />
                    <Appbar.Content titleStyle={{ textTransform: 'uppercase', fontSize: appBarsTitleFontSize }} title={getViewTitleI18n(props)} />
                </Appbar.Header> }}>
                    <StackNav.Screen name="dealMain" key="dealMain">
                        {(props: RouteProps) => <BottomNavigation onIndexChange={setTabIndex}
                            barStyle={{ backgroundColor: lightPrimaryColor }}
                            renderScene={
                                BottomNavigation.SceneMap({
                                    search: () => <Search {...props} />,
                                    history: History,
                                    resource: () => <Resources {...props} />,
                                    chat: () => <ScrollView><Chat {...props} /></ScrollView>,
                                    myNetwork: () => <ScrollView><MyNetwork {...props} /></ScrollView>,
                                })
                            }
                            theme={{ colors: { secondaryContainer: lightPrimaryColor }}}
                            renderIcon={(p) => {
                                return p.route.focusedIcon({ fill: p.focused ? primaryColor : '#000' })
                            }}
                            activeColor={primaryColor}
                            navigationState={{ index: tabIndex, routes: bottomRoutes }} />}
                    </StackNav.Screen>
                    <StackNav.Screen name="newResource" key="newResource" options={{ header: simpleBackHeader }}
                        component={EditResource} initialParams={{isNew: true}}/>
                    <StackNav.Screen name="viewResource" key="viewResource" options={{ header: simpleBackHeader }}
                        component={ViewResource} />
                    <StackNav.Screen name="editResource" key="editResource" options={{ header: simpleBackHeader }}
                        component={EditResource} />
                    <StackNav.Screen name="chat" key="chat" component={Chat} />
                    <StackNav.Screen name="networkMain" component={MyNetwork} key="networkMain" />
                    <StackNav.Screen initialParams={{ icon: <Images.Heart style={{ margin: 10 }} width={30} height={30} /> }} name="connections" component={Connections} key="connections" />
                    <StackNav.Screen name="addFriend" component={AddFriend} key="addFriend" />
                    <StackNav.Screen initialParams={{ icon: <Images.Received style={{ margin: 10 }} width={30} height={30} /> }} name="requestsReceived" component={RequestsReceived} key="requestsReceived" />
                    <StackNav.Screen initialParams={{ icon: <Images.Sent style={{ margin: 10 }} width={30} height={30} /> }} name="requestsSent" component={RequestsSent} key="requestsSent" />
                </StackNav.Navigator>
                <Portal>
                    <Snackbar visible={newMessages.length > 0} onDismiss={() => setNewMessages([])} duration={600000}
                        style={{ backgroundColor: lightPrimaryColor}}>
                        <ScrollView style={{ maxHeight: adaptHeight(80, 150, 300) }}>
                            <View style={{ flexDirection: 'row', flexWrap: 'nowrap', flex: 1 }}>
                                <View style={{ flexDirection: 'column', flex: 1 }}>
                                    <ListOf data={newMessages} 
                                        displayItem={(data, idx) => <List.Item key={idx} title={data.message.from.name} 
                                            description={data.message.text || '<image>'} onPress={async () => {
                                                appContext.actions.beginOp()
                                                try {
                                                    const resource = await getResource(data.resourceId)
                                                    navigation.navigate('chat', { resource } )
                                                    appContext.actions.endOp()
                                                    setNewMessages([])
                                                } catch(e) {
                                                    appContext.actions.endOpWithError(e)
                                                }
                                            }} />} />
                                </View>
                                <IconButton icon="close" onPress={() => setNewMessages([])} />
                            </View>
                        </ScrollView>
                    </Snackbar>
                </Portal>
            </View>
        </SearchFilterContextProvider>
    </EditResourceContextProvider>
}

export default DealBoard