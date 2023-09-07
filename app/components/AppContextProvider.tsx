import { createContext, useState } from "react"
import { Account } from "@/lib/schema"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getAccount } from "@/lib/api"
import React from "react"
import DataLoadState, { fromData, initial } from "@/lib/DataLoadState"

const SPLASH_DELAY = 3000

interface AppState {
    token: DataLoadState<string>,
    account?: Account,
    message?: string
}

interface AppActions {
    loginComplete: (token: string, account: Account) => Promise<Account>
    logout: () => Promise<void>
    tryRestoreToken: () => Promise<void>
    accountUpdated: (account: Account) => Promise<void>
    setTokenState: (newState: DataLoadState<string>) => void
    setMessage: (message: any) => void
}

interface AppContext {
    state: AppState,
    actions: AppActions
}

interface Props {
    children: JSX.Element
}

export const AppContext = createContext<AppContext>({
    state: { token: initial<string>(true), message: '' }, 
    actions: {
        loginComplete: (_, account) => Promise.resolve(account),
        tryRestoreToken: () => Promise.resolve(),
        accountUpdated: () => Promise.resolve(),
        logout: () => Promise.resolve(),
        setTokenState: () => {},
        setMessage: () => {},
    }
})

const AppContextProvider = ({ children }: Props) => {
    const [appState, setAppState] = useState({
        token: initial<string>(true), account: undefined
    } as AppState)

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
            let message: string | undefined
            if(messageObj instanceof Error) message = (messageObj as Error).stack
            else message = messageObj as string
            setAppState({ ...appState, ...{ message }})
        }
    }

    return <AppContext.Provider value={{ state: appState, actions}}>
        {children}
    </AppContext.Provider>
}

export default AppContextProvider