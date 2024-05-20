import { createContext, useState } from "react"
import { Account, AccountInfo, Category } from "@/lib/schema"
import React from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import dayjs from "dayjs"
import { ApolloClient, NormalizedCacheObject, gql } from "@apollo/client"
import { apolloTokenExpiredHandler, getAuthenticatedApolloClient } from "@/lib/utils"
import { get, remove, set } from "@/lib/secureStore"
import { registerForPushNotificationsAsync } from "@/lib/pushNotifications"
import { debug, info, setOrResetGlobalLogger } from "@/lib/logger"
import DataLoadState, { initial } from "@/lib/DataLoadState"

const SPLASH_DELAY = 3000
const TOKEN_KEY = 'token'

interface AppState {
    token: string
    account?: AccountInfo
    messages: string[]
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
    resetMessages: () => void
    setMessage: (message: any) => void
    notify: ( data: AppNotification ) => void
    onMessageReceived: (msg: any) => void
    setMessageReceived: (fn: (msg: any) => void) => void
    resetMessageReceived: () => void
    resetLastNofication: () => void
    setNewChatMessage: (msg: any) => void
    setCategories: (categories: DataLoadState<Category[]>) => void
}

export interface IAppContext {
    state: AppState,
    lastNotification?: AppNotification
    newChatMessage: any
    actions: AppActions
}

interface Props {
    children: JSX.Element
}

const emptyState: AppState = { 
    token: '', 
    messages: [], 
    numberOfUnread: 0,
    processing: false,
    categories: initial<Category[]>(true, [])
}

export const AppContext = createContext<IAppContext>({
    state: emptyState, 
    lastNotification: undefined,
    newChatMessage: undefined,
    actions: {
        loginComplete: async () => { return { activated: new Date(), avatarPublicId: '', email: '', id: 0, name: '' } },
        tryRestoreToken: () => Promise.resolve(),
        accountUpdated: () => Promise.resolve(),
        logout: () => Promise.resolve(),
        resetMessages: () => {},
        setMessage: () => {},
        notify: () => {},
        onMessageReceived: () => {},
        setMessageReceived: () => {},
        resetMessageReceived: () => {},
        resetLastNofication: () => {},
        setNewChatMessage: () => {},
        setCategories: () => {}
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

const AppContextProvider = ({ children }: Props) => {
    const [appState, setAppState] = useState(emptyState)
    // Remember: storing functions with useState is little bit weird, as the 'set' function has an overload that
    // takes a callback, and executes it immediately, we have to work around that using tricks
    const [messageReceivedCallback, setMessageReceivedCallback] = useState<(msg: any) => void>(() => {})
    const [lastNotification, setLastNofication] = useState({ message: '' } as AppNotification | undefined)
    const [newChatMessage, setNewChatMessage] = useState(undefined as any)

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

    const resetMessageReceived = () => setMessageReceivedCallback(() => (msg: any) => setNewChatMessage(msg))

    const logout = async () => {
        await remove(TOKEN_KEY)
        setNewAppState({ token: '', account: undefined })
        resetMessageReceived()
        info({ message: 'logged out' })
    }

    const handleLogin = (token: string): ApolloClient<NormalizedCacheObject> => {
        apolloTokenExpiredHandler.handle = async () => { 
            await logout()
        }
        const authenticatedClient = getAuthenticatedApolloClient(token)
        registerForPushNotificationsAsync().then(token => {
            authenticatedClient.mutate({ mutation: SYNC_PUSH_TOKEN, variables: { token } })
        })
        resetMessageReceived()
        
        return authenticatedClient
    }

    const actions: AppActions = {
        loginComplete: async (token: string): Promise<AccountInfo> => {
            await set(TOKEN_KEY, token)
            
            const authenticatedClient = handleLogin(token)

            const res = await authenticatedClient.query({ query: GET_SESSION_DATA })

            const account = {
                id: res.data.getSessionData.accountId, 
                name: res.data.getSessionData.name, 
                email: res.data.getSessionData.email, 
                avatarPublicId: res.data.getSessionData.avatarPublicId,
                activated: res.data.getSessionData.activated
            }

            setNewAppState({ token, account })

            await setOrResetGlobalLogger(res.data.getSessionData.logLevel)

            info({ message: `Logged in with session: ${ JSON.stringify(res.data.getSessionData) }` })

            return account
        },
        tryRestoreToken: async (): Promise<void> => {
            const token = await get(TOKEN_KEY)
            if(token) {
                const authenticatedClient = handleLogin(token)
                
                const getSessionPromise = authenticatedClient.query({ query: GET_SESSION_DATA })

                const sessionRes = await executeWithinMinimumDelay(getSessionPromise)
                setNewAppState({ token:token, account: {
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
        setMessage: (messageObj: any) => {
            let message: string
            if(messageObj instanceof Error) message = (messageObj as Error).stack!
            else message = messageObj as string
            setNewAppState({ messages: [...appState.messages, `${dayjs(new Date()).format('DD/MM/YYYY HH:mm:ss')}: ${message}\n`] })
        },
        resetMessages: () => {
            setNewAppState({ messages: [] })
        },
        notify: notif => {
            if(notif.message) {
                debug({ accountId: appState.account?.id, message: `In app notification: ${notif.message}` })
            } else if(notif.error) {
                info({ accountId: appState.account?.id, message: `In app error: ${JSON.stringify(notif.error)}` })
            }
            setLastNofication(notif)
        },
        setMessageReceived: fn => setMessageReceivedCallback(() => fn),
        resetMessageReceived,
        onMessageReceived: (msg) => messageReceivedCallback(msg),
        resetLastNofication: () => {
            setLastNofication(undefined)
        },
        setNewChatMessage: (msg: any) => {
            setNewChatMessage(msg)
        },
        setCategories: loadState => {
            setNewAppState({ categories: loadState})
        }
    }

    return <AppContext.Provider value={{ state: appState, lastNotification, newChatMessage, actions}}>
        <SafeAreaProvider style={{ flex: 1 }}>
            {children}
        </SafeAreaProvider>
    </AppContext.Provider>
}

export default AppContextProvider