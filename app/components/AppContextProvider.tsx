import { createContext, useState } from "react"
import { Account, AccountInfo } from "@/lib/schema"
import AsyncStorage from "@react-native-async-storage/async-storage"
import React from "react"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Snackbar } from "react-native-paper"
import dayjs from "dayjs"
import { t } from "@/i18n"
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

interface AppActions {
    loginComplete: (token: string) => Promise<void>
    logout: () => Promise<void>
    tryRestoreToken: () => Promise<void>
    accountUpdated: (account: Account) => Promise<void>
    resetMessages: () => void
    setMessage: (message: any) => void
    notify: (message: any) => void
    beginOp: () => void
    endOp: () => void
    endOpWithError: (error: any) => void
    pushMessageReceivedHandler: (handler : (msg: any) => void) => void
    popMessageReceivedHandler: () => void
}

interface AppContext {
    state: AppState,
    messageReceivedStack: ((msg: any) => void)[]
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

export const AppContext = createContext<AppContext>({
    state: emptyState, 
    messageReceivedStack: [],
    actions: {
        loginComplete: async () => {},
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
        popMessageReceivedHandler: () => {}
    }
})

const GET_SESSION_DATA = gql`query GetSessionData {
    getSessionData {
      accountId
      email
      name
    }
  }`

const AppContextProvider = ({ children }: Props) => {
    const [appState, setAppState] = useState(emptyState)
    const [messageReceivedStack, setMessageReceivedStack] = useState([] as ((msg: any) => void)[])
    const [lastNotification, setLastNofication] = useState('')

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
        console.log('AppState changed', fullNewAppState)
        setAppState(fullNewAppState)
    }

    const logout = async () => {
        await AsyncStorage.removeItem('token')
        setNewAppState({ token: '', account: undefined })
    }

    const actions: AppActions = {
        loginComplete: async (token: string): Promise<void> => {
            await AsyncStorage.setItem(TOKEN_KEY, token)

            apolloTokenExpiredHandler.handle = () => { 
                AsyncStorage.removeItem(TOKEN_KEY)
                setNewAppState({ token: '', account: undefined })
            }
            const authenticatedClient = getAuthenticatedApolloClient(token)
            const res = await authenticatedClient.query({ query: GET_SESSION_DATA })

            setNewAppState({ token, account: {
                id: res.data.getSessionData.accountId, name: res.data.getSessionData.name, email: res.data.getSessionData.email
            }})
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
                    id: sessionRes.data.getSessionData.accountId, name: sessionRes.data.getSessionData.name, email: sessionRes.data.getSessionData.email
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
            setLastNofication(t('requestError'))
        },
        pushMessageReceivedHandler: handler => {
            messageReceivedStack.push(handler)
            setMessageReceivedStack(messageReceivedStack)
        },
        popMessageReceivedHandler: () => {
            messageReceivedStack.pop()
            setMessageReceivedStack(messageReceivedStack)
        }
    }

    return <AppContext.Provider value={{ state: appState, messageReceivedStack, actions}}>
        <SafeAreaProvider style={{ flex: 1 }}>
            {children}
            <Snackbar visible={!!lastNotification} duration={4000} onDismiss={() => setLastNofication('')}>
                {lastNotification}
            </Snackbar>
        </SafeAreaProvider>
    </AppContext.Provider>
}

export default AppContextProvider