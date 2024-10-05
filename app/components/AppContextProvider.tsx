import React, { Dispatch } from 'react'
import { createContext, useReducer } from "react"
import { AccountInfo, Category } from '../lib/schema'
import DataLoadState, { initial } from '../lib/DataLoadState'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { getApolloClient } from '@/lib/apolloClient'
import { t } from '@/i18n'

interface AppNotification {
    message?: string
    error?: Error
}

export interface IAppState {
    account?: AccountInfo
    apolloClient?: ApolloClient<NormalizedCacheObject>
    chatMessagesSubscription?: { unsubscribe: () => void }
    notificationSubscription?: { unsubscribe: () => void }
    unreadConversations: number[]
    categories: DataLoadState<Category[]>
    lastNotification?: AppNotification
    newChatMessage: any
    connecting: { message: string, subMessage: string, onConnected: () => void } | undefined
    messageReceivedHandler: ((msg: any) => void) | undefined
    notificationReceivedHandler: (() => void) | undefined
    lastConversationChangeTimestamp: number
    numberOfUnreadNotifications: number
}

const initialAppState = { 
    unreadConversations: [],
    numberOfUnreadNotifications: 0,
    apolloClient: getApolloClient(''),
    categories: initial<Category[]>(true, []),
    chatMessagesSubscription: undefined,
    notificationSubscription: undefined,
    connecting: undefined,
    newChatMessage: undefined,
    messageReceivedHandler: undefined,
    notificationReceivedHandler: undefined,
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
  SetNewNotificationHandler,
  SetNewChatMessage,
  SetConnectingStatus,
  SetConversationRead,
  NotificationReceived,
  NotificationsRead,
  RefreshAccount
}

const appReducer = (previousState: IAppState, action: { type: AppReducerActionType, payload: any }): IAppState => {
    switch(action.type) {
        case AppReducerActionType.SetAuthToken:
          return {...previousState, ...{ token: action.payload }}
        case AppReducerActionType.Login:
          return {...previousState, ...{ account: action.payload.account, 
              chatMessagesSubscription: action.payload.chatMessagesSubscription, connecting: undefined, 
              apolloClient: action.payload.apolloClient, 
              notificationSubscription: action.payload.notificationSubscription,
              unreadConversations: action.payload.account.unreadConversations,
              numberOfUnreadNotifications: action.payload.account.numberOfUnreadNotifications
            }}
        case AppReducerActionType.Logout:
          return {...previousState, ...{ token: '', account: undefined, 
              chatMessagesSubscription: undefined, notificationSubscription: undefined,
              unreadConversations: [], numberOfUnreadNotifications: 0, apolloClient: action.payload.apolloClient
            }}
        case AppReducerActionType.UpdateAccount:
          return { ...previousState, ...{ account: action.payload, lastNotification: { message: t('updateAccountSuccessful') } } }
        case AppReducerActionType.DisplayNotification:
          return { ...previousState, ...{ lastNotification: { error: action.payload.error, message: action.payload.message } } }
        case AppReducerActionType.ClearNotification:
          return { ...previousState, ...{ lastNotification: undefined } }
        case AppReducerActionType.SetCategoriesState:
          return { ...previousState, ...{ categories: action.payload } }
        case AppReducerActionType.SetMessageReceivedHandler:
          return { ...previousState, ...{ messageReceivedHandler: action.payload.messageReceivedHandler } }
        case AppReducerActionType.SetNewNotificationHandler:
          return { ...previousState, ...{ notificationReceivedHandler: action.payload.handler } }
        case AppReducerActionType.SetNewChatMessage:
          if (!action.payload) {
            return { ...previousState, ...{ newChatMessage: undefined } }
          }
          const newState: any = { 
            lastConversationChangeTimestamp: new Date().valueOf(), 
            newChatMessage: action.payload 
          }
          
          if(action.payload) {
            const participantId = action.payload.participantByParticipantId?.id
            if(!previousState.unreadConversations.includes(participantId)) {
              newState.unreadConversations = [ ...previousState.unreadConversations, participantId ]
            }

            if(previousState.messageReceivedHandler) {
              previousState.messageReceivedHandler(action.payload)
            }
          }

          return { ...previousState, ...newState }
        case AppReducerActionType.NotificationReceived:
          if(previousState.notificationReceivedHandler) {
            previousState.notificationReceivedHandler()
          }
          return { ...previousState, ...{ numberOfUnreadNotifications: previousState.numberOfUnreadNotifications + 1 } }
        case AppReducerActionType.NotificationsRead:
          return { ...previousState, ...{ numberOfUnreadNotifications: 0 } }
        case AppReducerActionType.SetConnectingStatus:
          return { ...previousState, ...{ connecting: action.payload } }
        case AppReducerActionType.SetConversationRead:
          return { ...previousState, ...{ 
            lastConversationChangeTimestamp: new Date().valueOf(), 
            unreadConversations: previousState.unreadConversations.filter(val => val != action.payload)
          } }
        case AppReducerActionType.RefreshAccount:
          return { ...previousState, account: action.payload }
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