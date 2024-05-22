import {DefaultTheme, NavigationContainer, useNavigation } from '@react-navigation/native'
import React, { useContext, useEffect } from 'react'
import { ScrollView, View } from 'react-native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { t } from '@/i18n'
import { lightPrimaryColor, primaryColor } from '@/components/layout/constants'
import Profile from './Profile'
import DealBoard from './DealBoard'
import { Appbar, Portal, Snackbar } from 'react-native-paper'
import Container from '../layout/Container'
import { adaptHeight, appBarsTitleFontSize, getLanguage } from '@/lib/utils'
import { AppContext } from '../AppContextProvider'
import * as Linking from 'expo-linking'
import { gql, useLazyQuery } from '@apollo/client'
import { Subscription, addNotificationResponseReceivedListener, getLastNotificationResponseAsync } from 'expo-notifications'
import NewChatMessages from '../chat/NewChatMessages'
import { debug } from '@/lib/logger'
import { fromData, fromError } from '@/lib/DataLoadState'

const StackNav = createNativeStackNavigator()

const getViewTitleI18n = (viewName: string) => {
    switch (viewName) {
        case 'profile': return 'profile_label'
        default: return ''
    }
}

export const GET_CATEGORIES = gql`query Categories($locale: String) {
    allResourceCategories(condition: {locale: $locale}) {
        nodes {
          code
          name
        }
      }
  }
`

const prefix = Linking.createURL('/')
const getInitialURL = async () => {
    // First, you may want to do the default deep link handling
    // Check if app was opened from a deep link
    const url = await Linking.getInitialURL()

    if (url != null) {
        return url
    }

    // Handle URL from expo push notifications
    const response = await getLastNotificationResponseAsync()
    debug({ message: `Push notifications received in getInitialUrl, linking to ${response?.notification.request.content.data.url}` })
    return response?.notification.request.content.data.url
}
const subscribe = (listener: any) => {
    const onReceiveURL = ({ url }: { url: string }) => {
        debug({ message: `Push notifications received in Linking.addEventListener, linking to ${url}` })
        listener(url)
    }

    // Listen to incoming links from deep linking
    const eventListenerSubscription = Linking.addEventListener('url', onReceiveURL)

    let subscription: Subscription | undefined = undefined
    // Listen to expo push notifications
    //if(Device.isDevice && Device.brand) {
        subscription = addNotificationResponseReceivedListener(response => {
            const url = response.notification.request.content.data.url
    
            // Let React Navigation handle the URL
            debug({ message: `Push notifications received in addNotificationResponseReceivedListener, linking to ${url}` })
            listener(url)
        })
    //}

    return () => {
        // Clean up the event listeners
        eventListenerSubscription.remove()
        subscription?.remove()
    }
}

interface ChatMessagesNotificationAreaProps {
    onClose: () => void
    newMessage: any
}

const ChatMessagesNotificationArea = ({ onClose, newMessage }: ChatMessagesNotificationAreaProps) => {
    const appContext = useContext(AppContext)
    const navigation = useNavigation()
    return <Portal>
        <Snackbar visible={!!newMessage} onDismiss={onClose} duration={6000}
            style={{ backgroundColor: lightPrimaryColor}}>
            <ScrollView style={{ maxHeight: adaptHeight(80, 150, 300) }}>
                <NewChatMessages newMessages={newMessage ? [newMessage] : []} onClose={onClose}
                    onRequestConversationOpen={(resourceId, otherAccountId, otherAccountName) => {
                        navigation.navigate('chat', {
                            screen: 'conversation',
                            params: { resourceId, otherAccountId, otherAccountName }
                        })
                        onClose()
                    }} />
            </ScrollView>
        </Snackbar>
    </Portal>
} 

export default function Main () {
    const appContext = useContext(AppContext)
    const [getCategories] = useLazyQuery(GET_CATEGORIES)

    const loadCategories = async () => {
        try {
            const res = await getCategories({ variables: { locale: getLanguage() }})
            appContext.actions.setCategories(fromData(res.data.allResourceCategories.nodes))
        } catch(e) {
            appContext.actions.setCategories(fromError(e, t('requestError')))
        }
    }

    useEffect(() => {
        loadCategories()
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
                            chat: {
                                screens: {
                                    conversation: 'conversation'
                                }
                            }
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
                <StackNav.Navigator screenOptions={{ header: (props) =>
                    <Appbar.Header mode="center-aligned" style={{ backgroundColor: primaryColor }}>
                        <Appbar.BackAction onPress={() => props.navigation.navigate('main')} />
                        <Appbar.Content titleStyle={{ textTransform: 'uppercase', fontWeight: '400', fontSize: appBarsTitleFontSize, lineHeight: appBarsTitleFontSize }} title={t(getViewTitleI18n(props.route.name))}  />
                        <Appbar.Action icon="logout" size={appBarsTitleFontSize} color="#000" onPress={() => {
                            appContext.actions.logout()
                            props.navigation.reset({ routes: [
                                {name: 'main'}
                            ], index: 0 })
                        }} />
                    </Appbar.Header> }}>
                    <StackNav.Screen name="main" component={DealBoard} key="main" options={{ headerShown: false }} />
                    <StackNav.Screen name="profile" component={Profile} key="profile"  />
                </StackNav.Navigator>
                <ChatMessagesNotificationArea onClose={() => appContext.actions.setNewChatMessage(undefined)} newMessage={appContext.newChatMessage} />
            </View>
        </NavigationContainer>
    </Container>
}