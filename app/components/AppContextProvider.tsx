import { createContext, useState } from "react"
import { Account, AccountInfo } from "@/lib/schema"
import AsyncStorage from "@react-native-async-storage/async-storage"
import React from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import dayjs from "dayjs"
import { gql } from "@apollo/client"
import { TOKEN_KEY, apolloTokenExpiredHandler, getAuthenticatedApolloClient } from "@/lib/utils"

const SPLASH_DELAY = 3000

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
}

export interface IAppContext {
    state: AppState,
    messageReceivedStack: ((msg: any) => void)[]
    lastNotification?: AppNotification
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
        resetLastNofication: () => {}
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

const AppContextProvider = ({ children }: Props) => {
    const [appState, setAppState] = useState(emptyState)
    const [messageReceivedStack, setMessageReceivedStack] = useState([] as ((msg: any) => void)[])
    const [lastNotification, setLastNofication] = useState({ message: '' } as AppNotification | undefined)

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
        await AsyncStorage.removeItem('token')
        setNewAppState({ token: '', account: undefined })
    }

    const actions: AppActions = {
        loginComplete: async (token: string): Promise<AccountInfo> => {
            await AsyncStorage.setItem(TOKEN_KEY, token)

            apolloTokenExpiredHandler.handle = () => { 
                AsyncStorage.removeItem(TOKEN_KEY)
                setNewAppState({ token: '', account: undefined })
            }
            const authenticatedClient = getAuthenticatedApolloClient(token)
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
            const token = await AsyncStorage.getItem('token')
            if(token) {
                apolloTokenExpiredHandler.handle = () => { 
                    AsyncStorage.removeItem(TOKEN_KEY)
                    setNewAppState({ token: '', account: undefined })
                }
                const authenticatedClient = getAuthenticatedApolloClient(token)
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
        pushMessageReceivedHandler: handler => {
            messageReceivedStack.push(handler)
            setMessageReceivedStack(messageReceivedStack)
        },
        popMessageReceivedHandler: () => {
            messageReceivedStack.pop()
            setMessageReceivedStack(messageReceivedStack)
        },
        resetLastNofication: () => {
            setLastNofication(undefined)
        }
    }

    return <AppContext.Provider value={{ state: appState, lastNotification, messageReceivedStack, actions}}>
        <SafeAreaProvider style={{ flex: 1 }}>
            {children}
        </SafeAreaProvider>
    </AppContext.Provider>
}

export default AppContextProvider