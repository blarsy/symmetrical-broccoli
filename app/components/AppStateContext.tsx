import React, { Dispatch } from 'react'
import { createContext, useReducer } from "react"
import { Account, AccountInfo, Category } from '../lib/schema'
import DataLoadState, { initial } from '../lib/DataLoadState'

interface AppNotification {
    message?: string
    error?: Error
}

export interface IAppState {
    token: string
    account?: AccountInfo
    chatMessagesSubscription?: { unsubscribe: () => void }
    numberOfUnread: number
    categories: DataLoadState<Category[]>
    lastNotification?: AppNotification
    newChatMessage: any
    connecting: { message: string, subMessage: string, onConnected: (token: string, account?: Account) => void } | undefined
    messageReceivedHandler: ((msg: any) => void) | undefined
}

const initialAppState = { 
    token: '', 
    numberOfUnread: 0,
    categories: initial<Category[]>(true, []),
    chatMessagesSubscription: undefined,
    connecting: undefined,
    newChatMessage: undefined,
    messageReceivedHandler: undefined,
    account: undefined,
    lastNotification: undefined
} as IAppState

export enum AppReducerActionType {
  CompleteLogin,
  Logout,
  UpdateAccount,
  DisplayNotification,
  ClearNotification,
  SetCategoriesState,
  SetMessageReceivedHandler,
  SetNewChatMessage,
  SetChatMessagesSubscription,
  SetConnectingStatus
}

const appReducer = (previousState: IAppState, action: { type: AppReducerActionType, payload: any }): IAppState => {
    switch(action.type) {
        case AppReducerActionType.CompleteLogin:
          return {...previousState, ...{ account: action.payload, token: action.payload.token, chatMessagesSubscription: action.payload.subscription  }}
        case AppReducerActionType.Logout:
          return {...previousState, ...{ token: '', account: undefined, chatMessageSubscription: undefined, overrideMessageReceived: [] }}
        case AppReducerActionType.UpdateAccount:
          return { ...previousState, ...{ account: action.payload.account } }
        case AppReducerActionType.DisplayNotification:
          return { ...previousState, ...{ lastNotification: { error: action.payload.error, message: action.payload.message } } }
        case AppReducerActionType.ClearNotification:
          return { ...previousState, ...{ lastNotification: undefined } }
        case AppReducerActionType.SetCategoriesState:
          return { ...previousState, ...{ categories: action.payload.categories } }
        case AppReducerActionType.SetMessageReceivedHandler:
          return { ...previousState, ...{ messageReceivedHandler: action.payload.messageReceivedHandler } }
        case AppReducerActionType.SetNewChatMessage:
          return { ...previousState, ...{ newChatMessage: action.payload.newChatMessage } }
        case AppReducerActionType.SetChatMessagesSubscription:
          return { ...previousState, ...{ chatMessagesSubscription: action.payload.chatMessagesSubscription } }
        case AppReducerActionType.SetConnectingStatus:
          return { ...previousState, ...{ connecting: action.payload.connecting } }
        default:
          throw new Error(`Unexpected reducer action type ${action.type}`)
    }
}

export const AppContext = createContext<IAppState>(initialAppState)
export const AppDispatchContext = createContext((() => {}) as Dispatch<{ type: AppReducerActionType, payload: any }>)

export function AppStateContext({ children } : { children: JSX.Element }) {
    const [appState, dispatch] = useReducer<(previousState: IAppState, action: { type: AppReducerActionType, payload: any }) => IAppState>(appReducer, initialAppState)
  
    return (
      <AppContext.Provider value={appState}>
        <AppDispatchContext.Provider value={dispatch}>
          {children}
        </AppDispatchContext.Provider>
      </AppContext.Provider>
    )
  }