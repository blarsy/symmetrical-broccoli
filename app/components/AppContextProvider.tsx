import { createContext, useState } from "react"
import { Account, AccountInfo } from "@/lib/schema"
import React from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import dayjs from "dayjs"
import { ApolloClient, NormalizedCacheObject, gql } from "@apollo/client"
import { apolloTokenExpiredHandler, getAuthenticatedApolloClient } from "@/lib/utils"
import { get, remove, set } from "@/lib/secureStore"
import { registerForPushNotificationsAsync } from "@/lib/pushNotifications"

const SPLASH_DELAY = 3000
const TOKEN_KEY = 'token'

interface AppState {
    token: string
    account?: AccountInfo
    messages: string[]
    processing: boolean
    numberOfUnread: number
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
    beginOp: () => void
    endOp: () => void
    endOpWithError: (error: any) => void
    pushMessageReceivedHandler: (handler : (msg: any) => void) => void
    popMessageReceivedHandler: () => void
    resetLastNofication: () => void
    setNewChatMessage: (msg: string) => void
}

export interface IAppContext {
    state: AppState,
    messageReceivedStack: ((msg: any) => void)[]
    lastNotification?: AppNotification
    newChatMessage: string
    actions: AppActions
}

interface Props {
    children: JSX.Element
}

const emptyState: AppState = { 
    token: '', 
    messages: [], 
    numberOfUnread: 0,
    processing: false
}

export const AppContext = createContext<IAppContext>({
    state: emptyState, 
    messageReceivedStack: [],
    lastNotification: undefined,
    newChatMessage: '',
    actions: {
        loginComplete: async () => { return { activated: new Date(), avatarPublicId: '', email: '', id: 0, name: '' } },
        tryRestoreToken: () => Promise.resolve(),
        accountUpdated: () => Promise.resolve(),
        logout: () => Promise.resolve(),
        resetMessages: () => {},
        setMessage: () => {},
        notify: () => {},
        beginOp: () => {},
        endOp: () => {},
        endOpWithError: e => {},
        pushMessageReceivedHandler: () => {},
        popMessageReceivedHandler: () => {},
        resetLastNofication: () => {},
        setNewChatMessage: () => {}
    }
})

const GET_SESSION_DATA = gql`query GetSessionData {
    getSessionData {
      accountId
      email
      name
      avatarPublicId
      activated
    }
  }`

const SYNC_PUSH_TOKEN = gql`mutation SyncPushToken($token: String) {
    syncPushToken(input: {token: $token}) {
      integer
    }
  }`  

const AppContextProvider = ({ children }: Props) => {
    const [appState, setAppState] = useState(emptyState)
    const [messageReceivedStack, setMessageReceivedStack] = useState([] as ((msg: any) => void)[])
    const [lastNotification, setLastNofication] = useState({ message: '' } as AppNotification | undefined)
    const [newChatMessage, setNewChatMessage] = useState('')

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
        const fullNewAppState = { ...appState, ...newAppState }
        setAppState(fullNewAppState)
    }

    const logout = async () => {
        await remove(TOKEN_KEY)
        setNewAppState({ token: '', account: undefined })
        setMessageReceivedStack([])
    }

    const pushMessageReceivedHandler = (handler: (msg: any) => void) => {
        messageReceivedStack.push(handler)
        setMessageReceivedStack(messageReceivedStack)
    }

    const handleLogin = (token: string): ApolloClient<NormalizedCacheObject> => {
        apolloTokenExpiredHandler.handle = async () => { 
            await logout()
        }
        const authenticatedClient = getAuthenticatedApolloClient(token)
        registerForPushNotificationsAsync().then(token => {
            authenticatedClient.mutate({ mutation: SYNC_PUSH_TOKEN, variables: { token } })
        })
        pushMessageReceivedHandler((msg: any) => setNewChatMessage(msg))
        
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
            setNewAppState({ ...appState, ...{ messages: [] }})
        },
        notify: setLastNofication,
        beginOp: () => {
            setNewAppState({ processing: true })
        },
        endOp: () => {
            setNewAppState({ processing: false })
        },
        endOpWithError: e => {
            setNewAppState({ processing: false })
            setLastNofication({ error: e })
        },
        pushMessageReceivedHandler,
        popMessageReceivedHandler: () => {
            messageReceivedStack.pop()
            setMessageReceivedStack(messageReceivedStack)
        },
        resetLastNofication: () => {
            setLastNofication(undefined)
        },
        setNewChatMessage: (msg: string) => {
            setNewChatMessage(msg)
        }
    }

    return <AppContext.Provider value={{ state: appState, lastNotification, messageReceivedStack, newChatMessage, actions}}>
        <SafeAreaProvider style={{ flex: 1 }}>
            {children}
        </SafeAreaProvider>
    </AppContext.Provider>
}

export default AppContextProvider