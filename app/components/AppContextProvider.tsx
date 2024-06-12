import React, { Dispatch } from 'react'
import { createContext, useReducer } from "react"
import { AccountInfo, Category } from '../lib/schema'
import DataLoadState, { initial } from '../lib/DataLoadState'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { getApolloClient } from '@/lib/apolloClient'

interface AppNotification {
    message?: string
    error?: Error
}

export interface IAppState {
    account?: AccountInfo
    apolloClient?: ApolloClient<NormalizedCacheObject>
    chatMessagesSubscription?: { unsubscribe: () => void }
    numberOfUnread: number
    categories: DataLoadState<Category[]>
    lastNotification?: AppNotification
    newChatMessage: any
    connecting: { message: string, subMessage: string, onConnected: () => void } | undefined
    messageReceivedHandler: ((msg: any) => void) | undefined
    lastConversationChangeTimestamp: number
}

const initialAppState = { 
    numberOfUnread: 0,
    apolloClient: getApolloClient(''),
    categories: initial<Category[]>(true, []),
    chatMessagesSubscription: undefined,
    connecting: undefined,
    newChatMessage: undefined,
    messageReceivedHandler: undefined,
    account: undefined,
    lastNotification: undefined,
    lastConversationChangeTimestamp: new Date().valueOf()
} as IAppState

export enum AppReducerActionType {
  SetAuthToken,
  Login,
  Logout,
  UpdateAccount,
  DisplayNotification,
  ClearNotification,
  SetCategoriesState,
  SetMessageReceivedHandler,
  SetNewChatMessage,
  SetConnectingStatus,
  SetConversationsStale
}

const appReducer = (previousState: IAppState, action: { type: AppReducerActionType, payload: any }): IAppState => {
    switch(action.type) {
        case AppReducerActionType.SetAuthToken:
          return {...previousState, ...{ token: action.payload }}
        case AppReducerActionType.Login:
          return {...previousState, ...{ account: action.payload.account, chatMessagesSubscription: action.payload.subscription, connecting: undefined, apolloClient: action.payload.apolloClient }}
        case AppReducerActionType.Logout:
          return {...previousState, ...{ token: '', account: undefined, chatMessageSubscription: undefined, overrideMessageReceived: [] }}
        case AppReducerActionType.UpdateAccount:
          return { ...previousState, ...{ account: action.payload } }
        case AppReducerActionType.DisplayNotification:
          return { ...previousState, ...{ lastNotification: { error: action.payload.error, message: action.payload.message } } }
        case AppReducerActionType.ClearNotification:
          return { ...previousState, ...{ lastNotification: undefined } }
        case AppReducerActionType.SetCategoriesState:
          return { ...previousState, ...{ categories: action.payload } }
        case AppReducerActionType.SetMessageReceivedHandler:
          return { ...previousState, ...{ messageReceivedHandler: action.payload.messageReceivedHandler } }
        case AppReducerActionType.SetNewChatMessage:
          return { ...previousState, ...{ newChatMessage: action.payload } }
        case AppReducerActionType.SetConnectingStatus:
          return { ...previousState, ...{ connecting: action.payload } }
        case AppReducerActionType.SetConversationsStale:
          return { ...previousState, ...{ lastConversationChangeTimestamp: new Date().valueOf() } }
        default:
          throw new Error(`Unexpected reducer action type ${action.type}`)
    }
}

export const AppContext = createContext<IAppState>(initialAppState)
export const AppDispatchContext = createContext((() => {}) as Dispatch<{ type: AppReducerActionType, payload: any }>)

interface Props {
  children: JSX.Element
  initialState?: IAppState
  reducer?: (previousState: IAppState, action: {
      type: AppReducerActionType;
      payload: any;
  }) => IAppState
}

export function AppContextProvider({ children, initialState, reducer } : Props) {
    const [appState, dispatch] = useReducer<(previousState: IAppState, action: { type: AppReducerActionType, payload: any }) => IAppState>(reducer || appReducer, initialState || initialAppState)
  
    return (
      <AppContext.Provider value={appState}>
        <AppDispatchContext.Provider value={dispatch}>
          {children}
        </AppDispatchContext.Provider>
      </AppContext.Provider>
    )
}