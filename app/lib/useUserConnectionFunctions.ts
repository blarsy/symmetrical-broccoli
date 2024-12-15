import { AppContext, AppDispatchContext, AppReducerActionType } from "@/components/AppContextProvider"
import { useContext } from "react"
import { setOrResetGlobalLogger, info, debug } from "./logger"
import { ISecureStore } from "./secureStore"
import { apolloTokenExpiredHandler } from "./utils"
import { ApolloClient, NormalizedCacheObject, gql } from "@apollo/client"
import { registerForPushNotificationsAsync } from "./pushNotifications"
import secureStore from "./secureStore"
import { getApolloClient } from "./apolloClient"
import { AccountInfo } from "./schema"

export const GET_SESSION_DATA = gql`query GetSessionData {
    getSessionData {
      accountId
      email
      name
      avatarPublicId
      activated
      logLevel
      unreadConversations
      unreadNotifications
      willingToContribute
      amountOfTokens
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

export const ACCOUNT_CHANGE = gql`subscription AccountChange {
    accountChangeReceived {
      account {
        willingToContribute
        name
        language
        email
        avatarImageId
        amountOfTokens
        activated
        id
      }
    }
  }`

let overrideSecureStore:ISecureStore
let clientGetter: (token: string) => ApolloClient<NormalizedCacheObject>

export const setOverrides = ( overrides: { clientGetter?: (token: string) => ApolloClient<NormalizedCacheObject>, secureStore?: ISecureStore }) => {
    if(overrides.secureStore) overrideSecureStore = overrides.secureStore
    if(overrides.clientGetter) clientGetter = overrides.clientGetter
}

export default () => {
    const appDispatch = useContext(AppDispatchContext)
    const appState = useContext(AppContext)
    const actualStore = overrideSecureStore || secureStore
    const { get, set, remove } = actualStore

    const TOKEN_KEY = 'token'

    const reloadAccount = async () => {
        const token = await get(TOKEN_KEY)
        const { account } = await loadAccount(token)
        appDispatch({ type: AppReducerActionType.RefreshAccount, payload: account })
    }

    const loadAccount = async (token: string) => {
        const client = clientGetter ? clientGetter(token) : getApolloClient(token)

        const res = await client.query({ query: GET_SESSION_DATA })
    
        const account: AccountInfo = {
            id: res.data.getSessionData.accountId, 
            name: res.data.getSessionData.name, 
            email: res.data.getSessionData.email, 
            avatarPublicId: res.data.getSessionData.avatarPublicId,
            activated: res.data.getSessionData.activated,
            unreadConversations: res.data.getSessionData.unreadConversations,
            unreadNotifications: res.data.getSessionData.unreadNotifications,
            willingToContribute: res.data.getSessionData.willingToContribute,
            amountOfTokens: res.data.getSessionData.amountOfTokens,
            lastChangeTimestamp: new Date()
        }

        return { res, account, client }
    }

    const completeLogin = async (token: string) => {
        const { res, account, client } = await loadAccount(token)
    
        await setOrResetGlobalLogger(res.data.getSessionData.logLevel)

        apolloTokenExpiredHandler.handle = async () => { 
            await logout()
        }
        registerForPushNotificationsAsync().then(token => {
            if(token) {
                client.mutate({ mutation: SYNC_PUSH_TOKEN, variables: { token } })
            }
        })
        const messageSubscription = client.subscribe({ query: MESSAGE_RECEIVED }).subscribe({ next: payload => {
            debug({ message: `Received in-app chat message notification: ${payload.data.messageReceived.message}` })
            appDispatch({ type: AppReducerActionType.SetNewChatMessage, payload: payload.data.messageReceived.message })
        } })
        const notificationSubscription = client.subscribe({ query: NOTFICATION_RECEIVED }).subscribe({ next: payload => {
            debug({ message: `Received in-app notification: ${payload.data.notificationReceived.notification}` })
            // Here comes the notification parsing
            appDispatch({ type: AppReducerActionType.NotificationReceived, payload: payload.data.notificationReceived.notification })
        } })
        const accountChangeSubscription = client.subscribe({ query: ACCOUNT_CHANGE }).subscribe({ next: payload => {
            debug({ message: `Received in-app account change: ${payload.data.accountChangeReceived.account}` })
            // Here comes the notification parsing
            const updatedAccount: AccountInfo = {
                activated: payload.data.accountChangeReceived.account.activated,
                amountOfTokens: payload.data.accountChangeReceived.account.amountOfTokens,
                lastChangeTimestamp: new Date(),
                avatarPublicId: payload.data.accountChangeReceived.account.avatarPublicId,
                email: payload.data.accountChangeReceived.account.email,
                id: payload.data.accountChangeReceived.account.id,
                name: payload.data.accountChangeReceived.account.name,
                willingToContribute: payload.data.accountChangeReceived.account.willingToContribute,
                unreadConversations: [],
                unreadNotifications: []
            }
            appDispatch({ type: AppReducerActionType.AccountChanged, payload: updatedAccount })
        }})
        
        appDispatch({ type: AppReducerActionType.Login, payload: { account, apolloClient: client, 
            chatMessagesSubscription: messageSubscription, notificationSubscription, accountChangeSubscription,
            unreadNotifications: account.unreadNotifications,
            unreadConversations: account.unreadConversations
        } })

        info({ message: `Logged in with session: ${JSON.stringify(account)}` })
    }

    const logout = async () => {
      await remove(TOKEN_KEY)
      appState.chatMessagesSubscription?.unsubscribe()
      appState.notificationSubscription?.unsubscribe()
      appState.accountChangeSubscription?.unsubscribe()
      appDispatch({ type: AppReducerActionType.Logout, payload: { apolloClient: getApolloClient('') } })
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

    return { logout, ensureConnected, tryRestoreToken, login, reloadAccount }
}