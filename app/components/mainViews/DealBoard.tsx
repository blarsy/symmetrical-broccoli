import React, { useContext, useEffect, useState } from "react"
import { Appbar, BottomNavigation, Button, Icon, IconButton, List, Portal, Snackbar, Text } from "react-native-paper"
import { NavigationHelpers, ParamListBase } from "@react-navigation/native"
import { lightPrimaryColor, primaryColor } from "@/components/layout/constants"
import { ScrollView, View } from "react-native"
import Search from './Search'
import Chat from './Chat'
import History from './History'
import { t } from "@/i18n"
import Images from '@/Images'
import Resources from "./Resources"
import { NativeStackHeaderProps, createNativeStackNavigator } from "@react-navigation/native-stack"
import { NewMessageData, RouteProps, ScreenSize, adaptHeight, appBarsTitleFontSize, getScreenSize } from "@/lib/utils"
import EditResource from "../form/EditResource"
import ViewResource from "../ViewResource"
import EditResourceContextProvider from "../EditResourceContextProvider"
import { Resource } from "@/lib/schema"
import { ResourceImage } from "../MainResourceImage"
import { fontSizeMedium } from "./Start"
import { AppContext } from "../AppContextProvider"
import SearchFilterContextProvider from "../SearchFilterContextProvider"
import NewChatMessages from "../NewChatMessages"
import { gql, useSubscription } from "@apollo/client"
const StackNav = createNativeStackNavigator()

interface ChatHeaderProps {
    headerProps: NativeStackHeaderProps
}

const MESSAGE_RECEIVED = gql`subscription MessageReceivedSubscription {
    messageReceived {
      event
      message {
        id
        text
        participantByParticipantId {
          accountByAccountId {
            name
            id
          }
          conversationByConversationId {
            id
            resourceByResourceId {
              id
              title
            }
          }
        }
      }
    }
  }`

const ChatHeader = (p: ChatHeaderProps) => {
    const resource: Resource = (p.headerProps.route.params! as any).resource
    const exchangeTypes: string[] = []
    if(resource.canBeGifted) exchangeTypes.push(t('canBeGifted_label'))
    if(resource.canBeExchanged) exchangeTypes.push(t('canBeExchanged_label'))
    return (<View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start' }}>
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
    const [newMessage, setNewMessage] = useState(undefined as any | undefined)
    useSubscription(MESSAGE_RECEIVED, { onData(options) {
        setNewMessage(options.data.data.messageReceived.message)
    } })

    const appBarHeaderHeight = getScreenSize() != ScreenSize.sm ? 90 : 75

    const bottomRoutes = makeBottomRoutes(appContext.state.numberOfUnread)

    return <EditResourceContextProvider>
        <SearchFilterContextProvider>
            <View style={{ flex: 1 }}>
                <Appbar.Header mode="center-aligned" style={{ backgroundColor: primaryColor } }>
                    <Appbar.Content title={bottomRoutes[tabIndex].title} titleStyle={{ fontWeight: '400', textTransform: 'uppercase', textAlign: 'center', fontSize: appBarsTitleFontSize, lineHeight: appBarsTitleFontSize }} />
                    <Appbar.Action style={{ backgroundColor: '#fff', borderRadius: 23 }} icon={Images.Profile} size={30} onPress={() => { navigation.navigate('profile')}} />
                </Appbar.Header>
                <StackNav.Navigator
                    screenOptions={{ header: props => props.route.name != 'dealMain' && <Appbar.Header mode="center-aligned" statusBarHeight={0} style={{ backgroundColor: lightPrimaryColor, height: appBarHeaderHeight }}>
                    <Appbar.BackAction onPress={() => props.navigation.goBack()} />
                    <Appbar.Content titleStyle={{ textTransform: 'uppercase', fontSize: appBarsTitleFontSize, lineHeight: appBarsTitleFontSize }} title={getViewTitleI18n(props)} />
                </Appbar.Header> }}>
                    <StackNav.Screen name="dealMain" key="dealMain">
                        {(props: RouteProps) => <BottomNavigation onIndexChange={setTabIndex}
                            barStyle={{ backgroundColor: lightPrimaryColor }}
                            renderScene={
                                BottomNavigation.SceneMap({
                                    search: () => <Search {...props} />,
                                    history: History,
                                    resource: () => <Resources {...props} />,
                                    chat: () => <ScrollView><Chat {...props} /></ScrollView>
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
                </StackNav.Navigator>
                <Portal>
                    <Snackbar visible={!!newMessage} onDismiss={() => setNewMessage(undefined)} duration={600000}
                        style={{ backgroundColor: lightPrimaryColor}}>
                        <ScrollView style={{ maxHeight: adaptHeight(80, 150, 300) }}>
                            <NewChatMessages newMessages={newMessage ? [newMessage] : []} onClose={() => setNewMessage(undefined)}
                                onRequestConversationOpen={resource => {
                                    navigation.navigate('chat', { resource })
                                    setNewMessage(undefined)
                                }} />
                        </ScrollView>
                    </Snackbar>
                </Portal>
            </View>
        </SearchFilterContextProvider>
    </EditResourceContextProvider>
}

export default DealBoard