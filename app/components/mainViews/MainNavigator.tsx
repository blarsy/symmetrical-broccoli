import {DefaultTheme, NavigationContainer, useNavigation } from '@react-navigation/native'
import React, { useContext, useEffect } from 'react'
import { ScrollView, View } from 'react-native'
import { createNativeStackNavigator, NativeStackNavigationOptions } from '@react-navigation/native-stack'
import { lightPrimaryColor, primaryColor } from '@/components/layout/constants'
import { Portal, Snackbar } from 'react-native-paper'
import Container from '../layout/Container'
import { adaptHeight, getLanguage, RouteProps } from '@/lib/utils'
import * as Linking from 'expo-linking'
import { gql, useLazyQuery } from '@apollo/client'
import { Subscription, addNotificationResponseReceivedListener, getLastNotificationResponseAsync } from 'expo-notifications'
import NewChatMessages from '../chat/NewChatMessages'
import { debug } from '@/lib/logger'
import { fromData, fromError } from '@/lib/DataLoadState'
import { AppContext, AppDispatchContext, AppReducerActionType } from '../AppContextProvider'
import ConnectionDialog from '../ConnectionDialog'
import DealBoard from './DealBoard'
import Profile from '../account/Profile'

const StackNav = createNativeStackNavigator()

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
    subscription = addNotificationResponseReceivedListener(response => {
        const url = response.notification.request.content.data.url

        // Let React Navigation handle the URL
        debug({ message: `Push notifications received in addNotificationResponseReceivedListener, linking to ${url}` })
        listener(url)
    })

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

interface Props {
    screens: {
        name: string, 
        component: (r: RouteProps) => JSX.Element
        options?: NativeStackNavigationOptions
    }[]
}

export function Main ({ screens }: Props) {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const [getCategories] = useLazyQuery(GET_CATEGORIES)

    const loadCategories = async () => {
        try {
            const res = await getCategories({ variables: { locale: getLanguage() }})
            appDispatch({ type: AppReducerActionType.SetCategoriesState, payload: fromData(res.data.allResourceCategories.nodes) })
        } catch(e) {
            appDispatch({ type: AppReducerActionType.SetCategoriesState, payload: fromError(e) })
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
                            },
                            search: {
                                screens: {
                                    viewResource: 'viewresource',
                                    viewAccount: 'viewaccount'
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
                <StackNav.Navigator screenOptions={{ headerShown: false }}>
                    { screens.map((screenData, idx) => <StackNav.Screen key={idx} name={screenData.name} component={screenData.component} options={screenData.options}/>) }
                </StackNav.Navigator>
                <ChatMessagesNotificationArea onClose={() => appDispatch({ type: AppReducerActionType.SetNewChatMessage, payload: undefined })} newMessage={appContext.newChatMessage} />
            </View>
        </NavigationContainer>
        <ConnectionDialog onCloseRequested={() => appDispatch({ type: AppReducerActionType.SetConnectingStatus, payload: undefined })} visible={!!appContext.connecting}
            infoTextI18n={appContext.connecting?.message} infoSubtextI18n={appContext.connecting?.subMessage}
            onDone={() => {
                appContext.connecting?.onConnected()
            }} />
    </Container>
}

export default () => <Main screens={[{
    name: 'main', component: DealBoard
  }, {
    name: 'profile', component: Profile
}]} />