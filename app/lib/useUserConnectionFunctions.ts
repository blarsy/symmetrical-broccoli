import { AppContext, AppDispatchContext, AppReducerActionType } from "@/components/AppContextProvider"
import { useContext } from "react"
import { setOrResetGlobalLogger, info, debug } from "./logger"
import { AccountInfo, Account } from "./schema"
import { get, remove, set } from "./secureStore"
import { apolloTokenExpiredHandler, getAuthenticatedApolloClient } from "./utils"
import { ApolloClient, NormalizedCacheObject, gql } from "@apollo/client"
import { registerForPushNotificationsAsync } from "./pushNotifications"


const GET_SESSION_DATA = gql`query GetSessionData {
    getSessionData {
      accountId
      email
      name
      avatarPublicId
      activated
      logLevel
    }
  }`

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
  
  const SPLASH_DELAY = 3000
  async function executeWithinMinimumDelay<T>(promise: Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        setTimeout(async () => {
            try {
                const val = await promise
                resolve(val)
            } catch (e) {
                reject(e)
            }
        }, SPLASH_DELAY)
    })
  }

export default () => {
    const appDispatch = useContext(AppDispatchContext)
    const appState = useContext(AppContext)


    const TOKEN_KEY = 'token'
    const logout = async () => {
      await remove(TOKEN_KEY)
      appState.chatMessagesSubscription?.unsubscribe()
      appDispatch({ type: AppReducerActionType.Logout, payload: undefined })
      info({ message: 'logged out' })
    }

    const handleLogin = (token: string): {authenticatedClient : ApolloClient<NormalizedCacheObject>, subscription:  { unsubscribe: () => void } } => {
        apolloTokenExpiredHandler.handle = async () => { 
            await logout()
        }
        const authenticatedClient = getAuthenticatedApolloClient(token)
        registerForPushNotificationsAsync().then(token => {
            authenticatedClient.mutate({ mutation: SYNC_PUSH_TOKEN, variables: { token } })
        })
        const subscription = authenticatedClient.subscribe({ query: MESSAGE_RECEIVED }).subscribe({ next: payload => {
            debug({ message: `Received in-app chat message notification: ${payload.data.messageReceived.message}` })
            if(appState.messageReceivedHandler) {
              appState.messageReceivedHandler(payload.data.messageReceived.message)
            } else {
                appDispatch({ type: AppReducerActionType.SetNewChatMessage, payload: payload.data.messageReceived.message })
            }
        } })
        appDispatch({ type: AppReducerActionType.SetChatMessagesSubscription, payload: subscription })
        
        return { authenticatedClient, subscription }
    }

    const tryRestoreToken = async (): Promise<void> => {
        const token = await get(TOKEN_KEY)
        if(token) {
            const { authenticatedClient, subscription} = handleLogin(token)
            
            const getSessionPromise = authenticatedClient.query({ query: GET_SESSION_DATA })
    
            const sessionRes = await executeWithinMinimumDelay(getSessionPromise) as any
            const account = {
                id: sessionRes.data.getSessionData.accountId,
                name: sessionRes.data.getSessionData.name, 
                email: sessionRes.data.getSessionData.email, 
                avatarPublicId: sessionRes.data.getSessionData.avatarPublicId,
                activated: sessionRes.data.getSessionData.activated
            }
    
    
            appDispatch({ type: AppReducerActionType.CompleteLogin, payload: {token:token, chatMessagesSubscription: subscription, account} })
    
            await setOrResetGlobalLogger(sessionRes.data.getSessionData.logLevel)
    
            info({ message: `Restored session: ${ JSON.stringify(account) }` })
        } else {
            setTimeout(() => appDispatch({ type: AppReducerActionType.CompleteLogin, payload: { token: '', account: undefined, chatMessagesSubscription: undefined } }), SPLASH_DELAY)
        }
    }
  
    const loginComplete = async (token: string): Promise<AccountInfo> => {
        await set(TOKEN_KEY, token)
        
        const { authenticatedClient, subscription } = handleLogin(token)
    
        const res = await authenticatedClient.query({ query: GET_SESSION_DATA })
    
        const account = {
        id: res.data.getSessionData.accountId, 
        name: res.data.getSessionData.name, 
        email: res.data.getSessionData.email, 
        avatarPublicId: res.data.getSessionData.avatarPublicId,
        activated: res.data.getSessionData.activated
        }
    
        appDispatch({ type: AppReducerActionType.CompleteLogin, payload: { token, account, chatMessagesSubscription: subscription } })
    
        await setOrResetGlobalLogger(res.data.getSessionData.logLevel)
    
        info({ message: `Logged in with session: ${ JSON.stringify(account) }` })
    
        return account
    }
  
    const ensureConnected = (message: string, subMessage: string, onConnected: (token: string, account: Account) => void) => {
        if(appState.account) {
            onConnected(appState.token, appState.account)
        } else {
            appDispatch({ type: AppReducerActionType.SetConnectingStatus, payload: { message, subMessage, onConnected: (token: string, account: Account) => {
            if(token) {
                onConnected(token, account)
            }
        } } })
        }
    }

    return { logout, ensureConnected, tryRestoreToken, loginComplete }
}

