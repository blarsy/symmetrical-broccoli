import { AccountInfo } from "@/lib/useAccountFunctions"
import { createContext, Dispatch, JSX, useReducer } from "react"

export interface AppStateData {
  token: string
  account?: AccountInfo
  unreadNotifications: number[]
  notificationCustomHandler?: (notif: any) => void
  loading: boolean
  subscriptions: {unsubscribe: () => void}[]
}

const blankAppContext = { 
    token: '',
    unreadNotifications: [],
    loading: true,
    subscriptions: []
} as AppStateData

export enum AppReducerActionType {
  SetAuthToken,
  Login,
  Logout,
  Load,
  UpdateAccount,
  DisplayNotification,
  ClearNotification,
  SetNewNotificationHandler,
  SetNewChatMessage,
  SetConnectingStatus,
  NotificationReceived,
  NotificationsRead,
  NotificationRead,
  RefreshAccount,
  AccountChanged
}

const appReducer = (previousState: AppStateData, action: { type: AppReducerActionType, payload: any }): AppStateData => {
  let newState : any
  switch(action.type) {
      case AppReducerActionType.Login:
        newState = { loading: false, ...action.payload }
        break
      case AppReducerActionType.Load:
        newState = { loading: false }
        break
      case AppReducerActionType.Logout:
        newState = { ...blankAppContext, ...{ loading: false, account: undefined }}
        break
      case AppReducerActionType.UpdateAccount:
        newState = { account: { ...action.payload, ...{ lastChangeTimestamp: new Date() } } }
        break
      case AppReducerActionType.AccountChanged:
        newState = { account: action.payload }
        break
      case AppReducerActionType.NotificationRead:
        newState = { unreadNotifications: previousState.unreadNotifications.filter((currentId => currentId != action.payload))}
        break
      case AppReducerActionType.SetNewNotificationHandler:
        newState = { notificationCustomHandler: action.payload.handler }
        break
      case AppReducerActionType.NotificationReceived:
        if(previousState.notificationCustomHandler){
          setTimeout(() => previousState.notificationCustomHandler!(action.payload), 0)
        }

        newState = { unreadNotifications: [...previousState.unreadNotifications, action.payload.id] }
        break
      default:
        throw new Error(`Unexpected reducer action type ${action.type}`)
  }

  //console.log('app dispatch', {...previousState, ...newState})
  return {...previousState, ...newState}
}

export const AppContext = createContext<AppStateData>(blankAppContext)
export const AppDispatchContext = createContext((() => {}) as Dispatch<{ type: AppReducerActionType, payload: any }>)

interface Props {
    children: JSX.Element
    initial?: AppStateData
}
const AppContextProvider = ({ children, initial }: Props) => {
    const [appState, dispatch] = useReducer(appReducer, initial || blankAppContext)

    return <AppContext.Provider value={appState}>
        <AppDispatchContext.Provider value={dispatch} >
            {children}
        </AppDispatchContext.Provider>
    </AppContext.Provider>
}

export default AppContextProvider