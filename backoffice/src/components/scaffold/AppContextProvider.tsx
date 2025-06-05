import { AccountInfo } from "@/lib/useAccountFunctions"
import { createContext, Dispatch, Key, useEffect, useReducer } from "react"
import { Category } from "@/lib/schema"
import DataLoadState, { initial } from "@/lib/DataLoadState"
import { Observable, Subscription } from "zen-observable-ts"
import { FetchResult } from "@apollo/client"

export interface AppStateData {
  loading: boolean
  error?: Error
  version: string
  token: string
  i18n: {
    translator: (str: string | Key | string[] | Key[], opts?: any) => string
    lang: string
  }
  account?: AccountInfo
  lightMode?: boolean
  categories: DataLoadState<Category[]>
  unreadConversations: number[]
  unreadNotifications: number[]
  newChatMessage?: any
  messageSubscriber?: Observable<FetchResult<any>>
  messageSubscription?: Subscription
}

const blankAppContext = { 
    loading: true,
    token: '',
    categories: initial<Category[]>(false, undefined),
    version: '',
    i18n: {
      translator: (code) => `tr-${code}`,
      lang: ''
    },
    unreadConversations: [],
    unreadNotifications: []
} as AppStateData

export enum AppReducerActionType {
  SetAuthToken,
  Load,
  Login,
  Logout,
  SwitchLightMode,
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
  NotificationRead,
  RefreshAccount,
  AccountChanged
}

const appReducer = (previousState: AppStateData, action: { type: AppReducerActionType, payload: any }): AppStateData => {
  let newState : any
  switch(action.type) {
      case AppReducerActionType.Load:
        newState = { loading: false, i18n: action.payload.i18n, error: action.payload.error, version: action.payload.version, lightMode: action.payload.lightMode }
        break
      case AppReducerActionType.Login:
        newState = {...action.payload, ...{ loading: false }}
        break
      case AppReducerActionType.Logout:
        newState = { token: '', account: undefined }
        break
      case AppReducerActionType.SwitchLightMode:
        newState = { lightMode: !previousState.lightMode }
        break
      case AppReducerActionType.UpdateAccount:
        newState = { account: { ...action.payload, ...{ lastChangeTimestamp: new Date() } } }
        break
      case AppReducerActionType.SetCategoriesState:
        newState = { categories: action.payload }
        break
      case AppReducerActionType.SetMessageReceivedHandler:
        newState = { messageSubscription: action.payload }
        break
      case AppReducerActionType.SetNewChatMessage:
        if (!action.payload) {
          newState = { newChatMessage: undefined }
          break
        }
        
        const participantId = action.payload.participantByParticipantId?.id
        if(!previousState.unreadConversations.includes(participantId)) {
          newState = { newChatMessage: action.payload , unreadConversations: [ ...previousState.unreadConversations || [], participantId ] }
        } else {
          newState = { newChatMessage: action.payload }
        }
        
        break
      case AppReducerActionType.SetConversationRead:
        newState = { unreadConversations: previousState.unreadConversations.filter(c => c !== action.payload) }
        break
      default:
        throw new Error(`Unexpected reducer action type ${action.type}`)
  }

  return {...previousState, ...newState}
}

export const AppContext = createContext<AppStateData>(blankAppContext)
export const AppDispatchContext = createContext((() => {}) as Dispatch<{ type: AppReducerActionType, payload: any }>)

interface Props {
    children: JSX.Element
    initial?: AppStateData
}
const AppContextProvider = ({ children, initial }: Props) => {
    const [appState, dispatch] = useReducer<(previousState: AppStateData, action: { type: AppReducerActionType, payload: any }) => AppStateData>(appReducer, initial || blankAppContext)

    useEffect(() => (() => appState.messageSubscription && appState.messageSubscription.unsubscribe()), [])
    return <AppContext.Provider value={appState}>
        <AppDispatchContext.Provider value={dispatch} >
            {children}
        </AppDispatchContext.Provider>
    </AppContext.Provider>
}

export default AppContextProvider