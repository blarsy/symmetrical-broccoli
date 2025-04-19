import React, { Dispatch } from 'react'
import { createContext, useReducer } from "react"
import { AccountInfo, Category } from '../lib/schema'
import DataLoadState, { initial } from '../lib/DataLoadState'
import { ApolloClient, NormalizedCacheObject } from '@apollo/client'
import { getApolloClient } from '@/lib/apolloClient'

interface IAppNotification {
    message?: string
    error?: Error
}

export interface IAppState {
    account?: AccountInfo
    apolloClient?: ApolloClient<NormalizedCacheObject>
    chatMessagesSubscription?: { unsubscribe: () => void }
    notificationSubscription?: { unsubscribe: () => void }
    accountChangeSubscription?: { unsubscribe: () => void }
    unreadConversations: number[]
    categories: DataLoadState<Category[]>
    newChatMessage: any
    connecting: { message: string, subMessage: string, onConnected: () => void } | undefined
    messageReceivedHandler: ((msg: any) => void) | undefined
    notificationReceivedHandler: (() => void) | undefined
    lastConversationChangeTimestamp: number
    unreadNotifications: number[]
    lastResourceChangedTimestamp: number
}

const initialAppState = { 
    unreadConversations: [],
    unreadNotifications: [],
    apolloClient: getApolloClient(''),
    categories: initial<Category[]>(true, []),
    chatMessagesSubscription: undefined,
    notificationSubscription: undefined,
    connecting: undefined,
    newChatMessage: undefined,
    messageReceivedHandler: undefined,
    notificationReceivedHandler: undefined,
    account: undefined,
    lastConversationChangeTimestamp: new Date().valueOf(),
    lastResourceChangedTimestamp: new Date().valueOf()
} as IAppState

export enum AppReducerActionType {
  SetAuthToken,
  Login,
  Logout,
  UpdateAccount,
  SetCategoriesState,
  SetMessageReceivedHandler,
  SetNewNotificationHandler,
  SetNewChatMessage,
  SetConnectingStatus,
  SetConversationRead,
  NotificationReceived,
  NotificationsRead,
  NotificationRead,
  RefreshAccount,
  AccountChanged,
  ResourceUpdated
}

export enum AppAlertReducerActionType {
  DisplayNotification,
  ClearNotification,
}

const appReducer = (previousState: IAppState, action: { type: AppReducerActionType, payload: any }): IAppState => {
      let result: IAppState
      switch(action.type) {
        case AppReducerActionType.SetAuthToken:
          result = {...previousState, ...{ token: action.payload }}
          break
        case AppReducerActionType.Login:
          result = {...previousState, ...{ account: { ...action.payload.account, ...{ lastChangeTimestamp: new Date() }}, 
              chatMessagesSubscription: action.payload.chatMessagesSubscription, connecting: undefined, 
              apolloClient: action.payload.apolloClient, 
              notificationSubscription: action.payload.notificationSubscription,
              accountChangeSubscription: action.payload.accountChangeSubscription,
              unreadConversations: action.payload.account.unreadConversations,
              unreadNotifications: action.payload.account.unreadNotifications
            }}
            break
        case AppReducerActionType.Logout:
          result = {...previousState, ...{ token: '', account: undefined, 
              chatMessagesSubscription: undefined, notificationSubscription: undefined, accountChangeSubscription: undefined,
              unreadConversations: [], unreadNotifications: [], apolloClient: action.payload.apolloClient
            }}
            break
        case AppReducerActionType.UpdateAccount:
          result = { ...previousState, ...{ account: { ...action.payload, ...{ lastChangeTimestamp: new Date() }} } }
          break
        case AppReducerActionType.SetCategoriesState:
          result = { ...previousState, ...{ categories: action.payload } }
          break
        case AppReducerActionType.SetMessageReceivedHandler:
          result = { ...previousState, ...{ messageReceivedHandler: action.payload.messageReceivedHandler } }
          break
        case AppReducerActionType.SetNewNotificationHandler:
          result = { ...previousState, ...{ notificationReceivedHandler: action.payload.handler } }
          break
        case AppReducerActionType.SetNewChatMessage:
          if (!action.payload) {
            result = { ...previousState, ...{ newChatMessage: undefined } }
            break
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
              newState.newChatMessage = undefined
              setTimeout(() => previousState.messageReceivedHandler!(action.payload), 0)
            }
          }

          result = { ...previousState, ...newState }
          break
        case AppReducerActionType.NotificationReceived:
          if(previousState.notificationReceivedHandler) {
            previousState.notificationReceivedHandler()
          }
          result = { ...previousState, ...{ unreadNotifications: [...previousState.unreadNotifications, action.payload.id] } }
          break
        case AppReducerActionType.NotificationsRead:
          result = { ...previousState, ...{ unreadNotifications: [] } }
          break
        case AppReducerActionType.NotificationRead:
          result = { ...previousState, ...{ unreadNotifications: previousState.unreadNotifications.filter((currentId => currentId != action.payload)) } }
          break
        case AppReducerActionType.SetConnectingStatus:
          result = { ...previousState, ...{ connecting: action.payload } }
          break
        case AppReducerActionType.SetConversationRead:
          result = { ...previousState, ...{ 
            lastConversationChangeTimestamp: new Date().valueOf(), 
            unreadConversations: previousState.unreadConversations.filter(val => val != action.payload)
          } }
          break
        case AppReducerActionType.RefreshAccount:
          result = { ...previousState, account: { ...action.payload, ...{ lastChangeTimestamp: new Date() } }}
          break
        case AppReducerActionType.AccountChanged:
          result = { ...previousState, account: {...action.payload, ...{ unreadNotifications: previousState.unreadNotifications, unreadConversations: previousState.unreadConversations }} }
          break
        case AppReducerActionType.ResourceUpdated:
          result = { ...previousState, lastResourceChangedTimestamp: new Date().valueOf() }
          break
        default:
          throw new Error(`Unexpected reducer action type ${action.type}`)
    }
    //console.log('action', action)
    return result
}

const alertReducer = (previousState: IAppNotification, action: {type: AppAlertReducerActionType, payload: IAppNotification}): IAppNotification => {
  let result: IAppNotification
  switch(action.type) {
    case AppAlertReducerActionType.DisplayNotification:
      if(!action.payload.error && !action.payload.message) throw new Error('Notification data not provided. This is not allowed')
      result = action.payload
      break
    case AppAlertReducerActionType.ClearNotification:
      result = {}
      break
    default:
      throw new Error(`Unexpected alert reducer action type ${action.type}`)
  }
  //console.log('alert action', action)
  return result
}

export const AppContext = createContext<IAppState>(initialAppState)
export const AppAlertContext = createContext<IAppNotification>({})
export const AppDispatchContext = createContext((() => {}) as Dispatch<{ type: AppReducerActionType, payload: any }>)
export const AppAlertDispatchContext = createContext((() => {}) as Dispatch<{type: AppAlertReducerActionType, payload: IAppNotification}>)

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
    const [appAlertState, dispatchAlert] = useReducer(alertReducer, {})

    return (
      <AppContext.Provider value={appState}>
        <AppDispatchContext.Provider value={dispatch}>
          <AppAlertContext.Provider value={appAlertState}>
            <AppAlertDispatchContext.Provider value={dispatchAlert}>
              {children}
            </AppAlertDispatchContext.Provider>
          </AppAlertContext.Provider>
        </AppDispatchContext.Provider>
      </AppContext.Provider>
    )
}