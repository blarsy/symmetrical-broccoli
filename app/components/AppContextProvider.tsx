import { createContext, useState } from "react"
import { Account, Category } from "@/lib/schema"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getAccount } from "@/lib/api"
import React from "react"
import DataLoadState, { fromData, initial } from "@/lib/DataLoadState"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Snackbar } from "react-native-paper"
import dayjs from "dayjs"
import { t } from "@/i18n"
import { ChatSocket } from "@/lib/ChatSocket"

const SPLASH_DELAY = 3000

interface AppState {
    token: DataLoadState<string>
    account?: Account
    messages: string[]
    chatSocket?: ChatSocket
    processing: boolean
    numberOfUnread: number
}

interface AppActions {
    loginComplete: (token: string, account: Account) => Promise<Account>
    logout: () => Promise<void>
    tryRestoreToken: () => Promise<void>
    accountUpdated: (account: Account) => Promise<void>
    setTokenState: (newState: DataLoadState<string>) => void
    resetMessages: () => void
    setMessage: (message: any) => void
    notify: (message: any) => void
    beginOp: () => void
    endOp: () => void
    endOpWithError: (error: any) => void
}

interface AppContext {
    state: AppState,
    actions: AppActions
}

interface Props {
    children: JSX.Element
}

const emptyState: AppState = { 
    token: initial<string>(true, ''), 
    messages: [], 
    chatSocket: undefined,
    numberOfUnread: 0,
    processing: false
}

export const AppContext = createContext<AppContext>({
    state: emptyState, 
    actions: {
        loginComplete: (_, account) => Promise.resolve(account),
        tryRestoreToken: () => Promise.resolve(),
        accountUpdated: () => Promise.resolve(),
        logout: () => Promise.resolve(),
        setTokenState: () => {},
        resetMessages: () => {},
        setMessage: () => {},
        notify: () => {},
        beginOp: () => {},
        endOp: () => {},
        endOpWithError: e => {}
    }
})

const AppContextProvider = ({ children }: Props) => {
    const [appState, setAppState] = useState(emptyState)
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

    const actions: AppActions = {
        loginComplete: async (token: string, account: Account): Promise<Account> => {
            const storagePromise = AsyncStorage.setItem('token', token)
            const chatSocket = new ChatSocket(token, newNumber => setAppState({ ...appState, ...{ numberOfUnread: newNumber } }))
            await chatSocket.init()

            setAppState({ ...appState, ...{ token: fromData(token), account, chatSocket } })
            await storagePromise
            return account
        },
        tryRestoreToken: async (): Promise<void> => {
            const token = await AsyncStorage.getItem('token')
            if(token) {
                const accountPromise = getAccount(token)
                const chatSocket = new ChatSocket(token, newNumber => setAppState({ ...appState, ...{ numberOfUnread: newNumber } }))
                await chatSocket.init()
                const account = await executeWithinMinimumDelay(accountPromise)
                setAppState({ ...appState, ...{ token: fromData(token), account, chatSocket} })
                
            } else {
                setTimeout(() => setAppState({ ...appState, ...{ token: fromData('') } }), SPLASH_DELAY)
            }
        },
        accountUpdated: async (updatedAccount: Account) => {
            setAppState({ ...appState, ...{ account: updatedAccount } })
        },
        logout: async () => {
            await AsyncStorage.removeItem('token')
            setAppState({ ...appState, ...{ token: fromData(''), account: undefined } })
        },
        setTokenState: (newState: DataLoadState<string>) => {
            setAppState({ ...appState, ...{ token: newState, message: newState.error && newState.error.detail} })
        },
        setMessage: (messageObj: any) => {
            let message: string
            if(messageObj instanceof Error) message = (messageObj as Error).stack!
            else message = messageObj as string
            setAppState({ ...appState, ...{ messages: [...appState.messages, `${dayjs(new Date()).format('DD/MM/YYYY HH:mm:ss')}: ${message}\n`] }})
        },
        resetMessages: () => {
            setAppState({ ...appState, ...{ messages: [] }})
        },
        notify: setLastNofication,
        beginOp: () => {
            setAppState({...appState, ...{ processing: true }})
        },
        endOp: () => {
            setAppState({...appState, ...{ processing: false }})
        },
        endOpWithError: e => {
            setAppState({...appState, ...{ processing: false }})
            setLastNofication(t('requestError'))
        }
    }

    return <AppContext.Provider value={{ state: appState, actions}}>
        <SafeAreaProvider style={{ flex: 1 }}>
            {children}
            <Snackbar visible={!!lastNotification} duration={4000} onDismiss={() => setLastNofication('')}>
                {lastNotification}
            </Snackbar>
        </SafeAreaProvider>
    </AppContext.Provider>
}

export default AppContextProvider