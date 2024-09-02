import { AppContext, AppDispatchContext, AppReducerActionType } from "@/components/AppContextProvider"
import { useContext } from "react"
import { setOrResetGlobalLogger, info, debug } from "./logger"
import { ISecureStore } from "./secureStore"
import { apolloTokenExpiredHandler } from "./utils"
import { ApolloClient, NormalizedCacheObject, gql } from "@apollo/client"
import { registerForPushNotificationsAsync } from "./pushNotifications"
import secureStore from "./secureStore"
import { getApolloClient } from "./apolloClient"

export const GET_SESSION_DATA = gql`query GetSessionData {
    getSessionData {
      accountId
      email
      name
      avatarPublicId
      activated
      logLevel
      unreadConversations
      numberOfUnreadNotifications
    }
  }`

export const SYNC_PUSH_TOKEN = gql`mutation SyncPushToken($token: String) {
    syncPushToken(input: {token: $token}) {
      integer
    }
  }`

export const NOTFICATION_RECEIVED = gql`subscription NotificationSubscription {
  notificationReceived {
    event
    notification {
      data
      id
      created
      read
    }
  }
}`

export const MESSAGE_RECEIVED = gql`subscription MessageReceivedSubscription {
    messageReceived {
        event
        message {
            id
            text
            created
            received
            imageByImageId {
                publicId
            }
            participantByParticipantId {
                id
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

export default (overrideSecureStore?: ISecureStore, clientGetter?: (token: string) => ApolloClient<NormalizedCacheObject>) => {
    const appDispatch = useContext(AppDispatchContext)
    const appState = useContext(AppContext)
    const { get, set, remove } = overrideSecureStore || secureStore

    const TOKEN_KEY = 'token'

    const completeLogin = async (token: string) => {
        const client = clientGetter ? clientGetter(token) : getApolloClient(token)

        const res = await client.query({ query: GET_SESSION_DATA })
    
        const account = {
            id: res.data.getSessionData.accountId, 
            name: res.data.getSessionData.name, 
            email: res.data.getSessionData.email, 
            avatarPublicId: res.data.getSessionData.avatarPublicId,
            activated: res.data.getSessionData.activated,
            unreadConversations: res.data.getSessionData.unreadConversations,
            numberOfUnreadNotifications: res.data.getSessionData.numberOfUnreadNotifications
        }
    
        await setOrResetGlobalLogger(res.data.getSessionData.logLevel)

        apolloTokenExpiredHandler.handle = async () => { 
            await logout()
        }
        registerForPushNotificationsAsync().then(token => {
            client.mutate({ mutation: SYNC_PUSH_TOKEN, variables: { token } })
        })
        const messageSubscription = client.subscribe({ query: MESSAGE_RECEIVED }).subscribe({ next: payload => {
            debug({ message: `Received in-app chat message notification: ${payload.data.messageReceived.message}` })
            appDispatch({ type: AppReducerActionType.SetNewChatMessage, payload: payload.data.messageReceived.message })
        } })
        const notificationSubscription = client.subscribe({ query: NOTFICATION_RECEIVED }).subscribe({ next: payload => {
            debug({ message: `Received in-app notification notification: ${payload.data.notificationReceived.notification}` })
            appDispatch({ type: AppReducerActionType.NotificationReceived, payload: payload.data.notificationReceived.notification })
        } })
        
        appDispatch({ type: AppReducerActionType.Login, payload: { account, apolloClient: client, 
            chatMessagesSubscription: messageSubscription, notificationSubscription,
            numberOfUnreadNotifications: account.numberOfUnreadNotifications,
            unreadConversations: account.unreadConversations
        } })

        info({ message: `Logged in with session: ${JSON.stringify(account)}` })
    }

    const logout = async () => {
      await remove(TOKEN_KEY)
      appState.chatMessagesSubscription?.unsubscribe()
      appState.notificationSubscription?.unsubscribe()
      appDispatch({ type: AppReducerActionType.Logout, payload: undefined })
      info({ message: 'logged out' })
    }

    const tryRestoreToken = async (): Promise<void> => {
        const token = await get(TOKEN_KEY)
        if(token) {
            completeLogin(token)
        }
    }
  
    const login= async (token: string): Promise<void> => {
        await set(TOKEN_KEY, token)
        return completeLogin(token)
    }
  
    const ensureConnected = (message: string, subMessage: string, onConnected: () => void) => {
        if(appState.account) {
            onConnected()
        } else {
            appDispatch({ type: AppReducerActionType.SetConnectingStatus, payload: { message, subMessage, onConnected: (token: string) => {
            if(token) {
                onConnected()
            }
        } } })
        }
    }

    return { logout, ensureConnected, tryRestoreToken, login }
}

