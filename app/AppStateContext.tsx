import React, { Dispatch } from 'react'
import { createContext, useReducer } from "react"
import { Account, AccountInfo, Category } from './lib/schema'
import DataLoadState, { initial } from './lib/DataLoadState'

interface AppNotification {
    message?: string
    error?: Error
}

interface IAppState {
    token: string
    account?: AccountInfo
    chatMessagesSubscription?: { unsubscribe: () => void }
    processing: boolean
    numberOfUnread: number
    categories: DataLoadState<Category[]>
    lastNotification?: AppNotification
    newChatMessage: any
    connecting: { message: string, subMessage: string, onConnected: (token: string, account: Account) => void } | undefined
    overrideMessageReceived: ((msg: any) => void)[]
}

const initialAppState = { 
    token: '', 
    numberOfUnread: 0,
    processing: false,
    categories: initial<Category[]>(true, []),
    chatMessagesSubscription: undefined,
    connecting: undefined,
    newChatMessage: undefined,
    overrideMessageReceived: [],
    account: undefined,
    lastNotification: undefined
} as IAppState

export enum AppReducerActionType {

}

const appReducer = (previousState: IAppState, action: { type: AppReducerActionType }): IAppState => {
    switch(action.type) {
        
    }
    return initialAppState
}

export const AppContext = createContext<IAppState>(initialAppState)
export const AppDispatchContext = createContext(null as Dispatch<{ type: AppReducerActionType; }> | null)

export function AppStateContext({ children } : { children: JSX.Element }) {
    const [appState, dispatch] = useReducer<(previousState: IAppState, action: { type: AppReducerActionType }) => IAppState>(appReducer, initialAppState)
  
    return (
      <AppContext.Provider value={appState}>
        <AppDispatchContext.Provider value={dispatch}>
          {children}
        </AppDispatchContext.Provider>
      </AppContext.Provider>
    )
  }