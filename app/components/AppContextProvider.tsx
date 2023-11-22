import { createContext, useState } from "react"
import { Account } from "@/lib/schema"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getAccount } from "@/lib/api"
import React from "react"
import DataLoadState, { fromData, initial } from "@/lib/DataLoadState"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Snackbar } from "react-native-paper"
import dayjs from "dayjs"

const SPLASH_DELAY = 3000

interface AppState {
    token: DataLoadState<string>,
    account?: Account,
    messages: string[]
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
}

interface AppContext {
    state: AppState,
    actions: AppActions
}

interface Props {
    children: JSX.Element
}

export const AppContext = createContext<AppContext>({
    state: { token: initial<string>(true, ''), messages: [] }, 
    actions: {
        loginComplete: (_, account) => Promise.resolve(account),
        tryRestoreToken: () => Promise.resolve(),
        accountUpdated: () => Promise.resolve(),
        logout: () => Promise.resolve(),
        setTokenState: () => {},
        resetMessages: () => {},
        setMessage: () => {},
        notify: () => {}
    }
})

const AppContextProvider = ({ children }: Props) => {
    const [appState, setAppState] = useState({
        token: initial<string>(true, ''), account: undefined, messages: []
    } as AppState)
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
            await AsyncStorage.setItem('token', token)
            setAppState({ ...appState, ...{ token: fromData(token), account } })
            return account
        },
        tryRestoreToken: async (): Promise<void> => {
            const token = await AsyncStorage.getItem('token')
            if(token) {
                const accountPromise = getAccount(token)
                const account = await executeWithinMinimumDelay(accountPromise)
                setAppState({ ...appState, ...{ token: fromData(token), account } })
                
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
        notify: setLastNofication
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