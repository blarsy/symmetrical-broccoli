import { AccountInfo } from "@/lib/useAccountFunctions"
import { TFunction } from "i18next"
import { createContext, Dispatch, useReducer } from "react"

export interface AppStateData {
  loading: boolean
  error?: Error
  version: string
  token: string
  i18n: {
    translator: TFunction<"translation", undefined>
    lang: string
  }
  account?: AccountInfo
  lightMode?: boolean
}

const blankAppContext = { 
    loading: true,
    token: '',
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
      default:
        throw new Error(`Unexpected reducer action type ${action.type}`)
  }

  //console.log('previous', previousState, 'new', newState)

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