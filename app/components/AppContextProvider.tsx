import React, { createContext, useState } from "react"
import { Account } from "../lib/schema"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { getAccount } from "../lib/api"

interface AppState {
    token: string,
    account?: Account
}

interface AppActions {
    loginComplete: (token: string, account: Account) => Promise<Account>
    tryRestoreToken: () => Promise<void>
    accountUpdated: (account: Account) => Promise<void>
}

interface AppContext {
    state: AppState,
    actions: AppActions
}

interface Props {
    children: JSX.Element
}

export const AppContext = createContext<AppContext>({
    state: { token: '' }, 
    actions: {
        loginComplete: (token, account) => Promise.resolve(account),
        tryRestoreToken: () => Promise.resolve(),
        accountUpdated: (account) => Promise.resolve()
    }
})

const AppContextProvider = ({ children }: Props) => {
    const [appState, setAppState] = useState({
        token: '', account: undefined
    } as AppState)

    const actions: AppActions = {
        loginComplete: async (token: string, account: Account): Promise<Account> => {
            await AsyncStorage.setItem('token', token)
            setAppState({ ...appState, ...{ token, account } })
            return account
        },
        tryRestoreToken: async (): Promise<void> => {
            const token = await AsyncStorage.getItem('token')
            if(token) {
                const account = await getAccount(token)
                console.log({ token, account })
                setAppState({ ...appState, ...{ token, account } })
            }
        },
        accountUpdated: async (updatedAccount: Account) => {
            setAppState({ ...appState, ...{ account: updatedAccount } })
        }
    }

    return <AppContext.Provider value={{ state: appState, actions}}>
        {children}
    </AppContext.Provider>
}

export default AppContextProvider