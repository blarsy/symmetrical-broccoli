import { AccountInfo } from "@/lib/useAccountFunctions"
import { createContext, Dispatch, useReducer } from "react"

export interface AppStateData {
  token: string
  account?: AccountInfo
  unreadNotifications: number[]
}

const blankAppContext = { 
    token: '',
    unreadNotifications: []
} as AppStateData

export enum AppReducerActionType {
  SetAuthToken,
  Login,
  Logout,
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
        newState = action.payload
        break
      case AppReducerActionType.Logout:
        newState = { token: '', account: undefined }
        break
      case AppReducerActionType.UpdateAccount:
        newState = { account: { ...action.payload, ...{ lastChangeTimestamp: new Date() } } }
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

    return <AppContext.Provider value={appState}>
        <AppDispatchContext.Provider value={dispatch} >
            {children}
        </AppDispatchContext.Provider>
    </AppContext.Provider>
}

export default AppContextProvider