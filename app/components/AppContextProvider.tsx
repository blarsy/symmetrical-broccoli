import { createContext, useState } from "react"
import { Account } from "../lib/schema"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getAccount } from "../lib/api"
import React from "react"
import DataLoadState, { fromData, initial } from "../lib/DataLoadState"

interface AppState {
    token: DataLoadState<string>,
    account?: Account
}

interface AppActions {
    loginComplete: (token: string, account: Account) => Promise<Account>
    logout: () => Promise<void>
    tryRestoreToken: () => Promise<void>
    accountUpdated: (account: Account) => Promise<void>
    setTokenState: (newState: DataLoadState<string>) => void
}

interface AppContext {
    state: AppState,
    actions: AppActions
}

interface Props {
    children: JSX.Element
}

export const AppContext = createContext<AppContext>({
    state: { token: initial<string>(true) }, 
    actions: {
        loginComplete: (_, account) => Promise.resolve(account),
        tryRestoreToken: () => Promise.resolve(),
        accountUpdated: () => Promise.resolve(),
        logout: () => Promise.resolve(),
        setTokenState: () => {}
    }
})

const AppContextProvider = ({ children }: Props) => {
    const [appState, setAppState] = useState({
        token: initial<string>(true), account: undefined
    } as AppState)

    const actions: AppActions = {
        loginComplete: async (token: string, account: Account): Promise<Account> => {
            await AsyncStorage.setItem('token', token)
            setAppState({ ...appState, ...{ token: fromData(token), account } })
            return account
        },
        tryRestoreToken: async (): Promise<void> => {
            const token = await AsyncStorage.getItem('token')
            if(token) {
                const account = await getAccount(token)
                setAppState({ ...appState, ...{ token: fromData(token), account } })
            } else {
                setAppState({ ...appState, ...{ token: fromData('') } })
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
            setAppState({ ...appState, ...{ token: newState} })
        }
    }

    return <AppContext.Provider value={{ state: appState, actions}}>
        {children}
    </AppContext.Provider>
}

export default AppContextProvider