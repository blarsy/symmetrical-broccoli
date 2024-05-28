import { createContext, useState } from "react"
import { Account, AccountInfo, Category } from "@/lib/schema"
import React from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { ApolloClient, NormalizedCacheObject, gql } from "@apollo/client"
import { apolloTokenExpiredHandler, errorToString, getAuthenticatedApolloClient } from "@/lib/utils"
import { get, remove, set } from "@/lib/secureStore"
import { registerForPushNotificationsAsync } from "@/lib/pushNotifications"
import { debug, info, setOrResetGlobalLogger } from "@/lib/logger"
import DataLoadState, { initial } from "@/lib/DataLoadState"

const SPLASH_DELAY = 3000
const TOKEN_KEY = 'token'

interface AppState {
    token: string
    account?: AccountInfo
    chatMessagesSubscription?: { unsubscribe: () => void }
    processing: boolean
    numberOfUnread: number
    categories: DataLoadState<Category[]>
}

interface AppNotification {
    message?: string
    error?: Error
}

interface AppActions {
    loginComplete: (token: string) => Promise<AccountInfo>
    logout: () => Promise<void>
    tryRestoreToken: () => Promise<void>
    accountUpdated: (account: Account) => Promise<void>
    notify: ( data: AppNotification ) => void
    setMessageReceivedHandler: (fn: (msg: any) => void) => void
    resetMessageReceived: () => void
    resetLastNofication: () => void
    setNewChatMessage: (msg: any) => void
    setCategories: (categories: DataLoadState<Category[]>) => void
    setChatMessageSubscription: (subscription: { unsubscribe: () => void }) => void
}

export interface IAppContext {
    state: AppState,
    lastNotification?: AppNotification
    newChatMessage: any
    actions: AppActions
    overrideMessageReceived: ((msg: any) => void)[]
}

interface Props {
    children: JSX.Element
}

const emptyState: AppState = { 
    token: '', 
    numberOfUnread: 0,
    processing: false,
    categories: initial<Category[]>(true, []),
    chatMessagesSubscription: undefined
}

export const AppContext = createContext<IAppContext>({
    state: emptyState, 
    lastNotification: undefined,
    newChatMessage: undefined,
    overrideMessageReceived: [],
    actions: {
        loginComplete: async () => { return { activated: new Date(), avatarPublicId: '', email: '', id: 0, name: '' } },
        tryRestoreToken: () => Promise.resolve(),
        accountUpdated: () => Promise.resolve(),
        logout: () => Promise.resolve(),
        notify: () => {},
        setMessageReceivedHandler: () => {},
        resetMessageReceived: () => {},
        resetLastNofication: () => {},
        setNewChatMessage: () => {},
        setCategories: () => {},
        setChatMessageSubscription: () => {}
    }
})

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


const AppContextProvider = ({ children }: Props) => {
    const [appState, setAppState] = useState(emptyState)
    const [lastNotification, setLastNofication] = useState({ message: '' } as AppNotification | undefined)
    const [newChatMessage, setNewChatMessage] = useState(undefined as any)
    const [overrideMessageReceived, setOverrideMessageReceived] = useState<((msg: any) => void)[]>([])

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

    const setNewAppState = (newAppState: any) => {
        setAppState(prevState => ({ ...prevState, ...newAppState }))
    }

    const logout = async () => {
        await remove(TOKEN_KEY)
        appState.chatMessagesSubscription?.unsubscribe()
        setNewAppState({ token: '', account: undefined, chatMessageSubscription: undefined })
        overrideMessageReceived.pop()
        setOverrideMessageReceived(overrideMessageReceived)
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
            if(overrideMessageReceived.length > 0) {
                overrideMessageReceived[0](payload.data.messageReceived.message)
            } else {
                setNewChatMessage(payload.data.messageReceived.message)
            }
        } })
        
        return { authenticatedClient, subscription }
    }

    const actions: AppActions = {
        loginComplete: async (token: string): Promise<AccountInfo> => {
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

            setNewAppState({ token, account, chatMessagesSubscription: subscription })

            await setOrResetGlobalLogger(res.data.getSessionData.logLevel)

            info({ message: `Logged in with session: ${ JSON.stringify(res.data.getSessionData) }` })

            return account
        },
        tryRestoreToken: async (): Promise<void> => {
            const token = await get(TOKEN_KEY)
            if(token) {
                const { authenticatedClient, subscription} = handleLogin(token)
                
                const getSessionPromise = authenticatedClient.query({ query: GET_SESSION_DATA })

                const sessionRes = await executeWithinMinimumDelay(getSessionPromise)
                setNewAppState({ token:token, chatMessagesSubscription: subscription, account: {
                    id: sessionRes.data.getSessionData.accountId,
                    name: sessionRes.data.getSessionData.name, 
                    email: sessionRes.data.getSessionData.email, 
                    avatarPublicId: sessionRes.data.getSessionData.avatarPublicId,
                    activated: sessionRes.data.getSessionData.activated
                }})

                await setOrResetGlobalLogger(sessionRes.data.getSessionData.logLevel)

                info({ message: `Restored session: ${ JSON.stringify(sessionRes.data.getSessionData) }` })
            } else {
                setTimeout(() => setNewAppState({ token: '' }), SPLASH_DELAY)
            }
        },
        accountUpdated: async (updatedAccount: Account) => {
            setNewAppState({ account: updatedAccount })
        },
        logout,
        notify: notif => {
            if(notif.message) {
                debug({ accountId: appState.account?.id, message: `In app notification: ${notif.message}` })
            } else if(notif.error) {
                info({ accountId: appState.account?.id, message: `In app error: ${errorToString(notif.error)}` })
            }
            setLastNofication(notif)
        },
        setMessageReceivedHandler: fn => {
            overrideMessageReceived.push(fn)
            setOverrideMessageReceived(overrideMessageReceived)
        },
        resetMessageReceived: () => {
            overrideMessageReceived.pop()
            setOverrideMessageReceived(overrideMessageReceived)
        },
        resetLastNofication: () => {
            setLastNofication(undefined)
        },
        setNewChatMessage: (msg: any) => {
            setNewChatMessage(msg)
        },
        setCategories: loadState => {
            setNewAppState({ categories: loadState})
        },
        setChatMessageSubscription: subscription => setNewAppState({ chatMessagesSubscription: subscription })
    }

    return <AppContext.Provider value={{ state: appState, lastNotification, newChatMessage, actions, overrideMessageReceived}}>
        <SafeAreaProvider style={{ flex: 1 }}>
            {children}
        </SafeAreaProvider>
    </AppContext.Provider>
}

export default AppContextProvider