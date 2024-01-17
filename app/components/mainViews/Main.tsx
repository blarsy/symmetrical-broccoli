import {DefaultTheme, NavigationContainer, useNavigation } from '@react-navigation/native'
import React, { useContext, useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { t } from '@/i18n'
import { lightPrimaryColor, primaryColor } from '@/components/layout/constants'
import Profile from './Profile'
import DealBoard from './DealBoard'
import { Appbar, Portal, Snackbar } from 'react-native-paper'
import Container from '../layout/Container'
import { adaptHeight, appBarsTitleFontSize } from '@/lib/utils'
import { AppContext } from '../AppContextProvider'
import * as Linking from 'expo-linking'
import { gql, useMutation, useSubscription } from '@apollo/client'
import { registerForPushNotificationsAsync } from '@/lib/pushNotifications'
import { addNotificationResponseReceivedListener, getLastNotificationResponseAsync } from 'expo-notifications'
import NewChatMessages from '../NewChatMessages'

const StackNav = createNativeStackNavigator()

const getViewTitleI18n = (viewName: string) => {
    switch (viewName) {
        case 'profile': return 'profile_label'
        default: return ''
    }
}

const SYNC_PUSH_TOKEN = gql`mutation SyncPushToken($token: String) {
    syncPushToken(input: {token: $token}) {
      integer
    }
  }`  

const MESSAGE_RECEIVED = gql`subscription MessageReceivedSubscription {
    messageReceived {
        event
        message {
            id
            text
            created
            received
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

const prefix = Linking.createURL('/')
const getInitialURL = async () => {
    // First, you may want to do the default deep link handling
    // Check if app was opened from a deep link
    // const url = await Linking.getInitialURL()

    // if (url != null) {
    //     console.log(`Initial Url from deep link config: ${url}`)
    //     return url
    // }

    // Handle URL from expo push notifications
    const response = await getLastNotificationResponseAsync()

    console.log(`Initial Url from Expo push: ${response?.notification.request.content.data.url}`)

    return response?.notification.request.content.data.url
}
const subscribe = (listener: any) => {
    const onReceiveURL = ({ url }: { url: string }) => {
        console.log(`navigating to ${url} via onReceiveURL`)
        listener(url)
    }

    // Listen to incoming links from deep linking
    // const eventListenerSubscription = Linking.addEventListener('url', onReceiveURL)

    // console.log('subscribed ...')

    // Listen to expo push notifications
    const subscription = addNotificationResponseReceivedListener(response => {
        const url = response.notification.request.content.data.url
        console.log(`navigating to ${url}`)

        // Let React Navigation handle the URL
        listener(url)
    })

    return () => {
        // Clean up the event listeners
        //eventListenerSubscription.remove()
        subscription.remove()
    }
}

interface ChatMessagesNotificationAreaProps {
    onClose: () => void
    newMessage: string
}

const ChatMessagesNotificationArea = ({ onClose, newMessage }: ChatMessagesNotificationAreaProps) => {
    const navigation = useNavigation()
    return <Portal>
        <Snackbar visible={!!newMessage} onDismiss={onClose} duration={6000}
            style={{ backgroundColor: lightPrimaryColor}}>
            <ScrollView style={{ maxHeight: adaptHeight(80, 150, 300) }}>
                <NewChatMessages newMessages={newMessage ? [newMessage] : []} onClose={onClose}
                    onRequestConversationOpen={resource => {
                        navigation.navigate('chat', {
                            screen: 'conversation',
                            params: {
                                resourceId: resource.id
                            }
                        })
                        onClose()
                    }} />
            </ScrollView>
        </Snackbar>
    </Portal>
} 

export default function Main () {
    const appContext = useContext(AppContext)
    const [newMessage, setNewMessage] = useState(undefined as any | undefined)

    const [syncPushToken] = useMutation(SYNC_PUSH_TOKEN)

    useSubscription(MESSAGE_RECEIVED, { onData(options) {
        appContext.state.messageReceivedStack[appContext.state.messageReceivedStack.length - 1](options.data.data.messageReceived.message)
    } })

    useEffect(() => {
        registerForPushNotificationsAsync().then(token => syncPushToken({ variables: { token }}))
        appContext.actions.pushMessageReceivedHandler((msg: any) => setNewMessage(msg))
        return () => {
            appContext.actions.popMessageReceivedHandler()
        }
    }, [])

    return <Container style={{ flexDirection: 'column' }}>
        <NavigationContainer linking={{
            prefixes: [prefix],
            getInitialURL,
            subscribe,
            config: {
                screens: {
                    main: {
                        screens: {
                            chat: 'chat'
                        }
                    },
                    profile: 'profile'
                }
            }
        }} theme={{
            colors: {
                ...DefaultTheme.colors,
                card: primaryColor
            }, dark: false
        }}>
            <View style={{ flex: 1,alignItems: 'stretch', alignSelf: 'stretch', justifyContent: 'center', alignContent: 'stretch' }}>
                <StackNav.Navigator screenOptions={{ header: (props) => <Appbar.Header mode="center-aligned" style={{ backgroundColor: primaryColor }}>
                        <Appbar.BackAction onPress={() => props.navigation.goBack()} />
                        <Appbar.Content titleStyle={{ textTransform: 'uppercase', fontWeight: '400', fontSize: appBarsTitleFontSize, lineHeight: appBarsTitleFontSize }} title={t(getViewTitleI18n(props.route.name))}  />
                        <Appbar.Action icon="logout" size={appBarsTitleFontSize} color="#000" onPress={() => appContext.actions.logout()} />
                    </Appbar.Header> }}>
                    <StackNav.Screen name="main" component={DealBoard} key="main" options={{ headerShown: false }} />
                    <StackNav.Screen name="profile" component={Profile} key="profile"  />
                </StackNav.Navigator>
                <ChatMessagesNotificationArea onClose={() => setNewMessage(undefined)} newMessage={newMessage} />
            </View>
        </NavigationContainer>
    </Container>
}