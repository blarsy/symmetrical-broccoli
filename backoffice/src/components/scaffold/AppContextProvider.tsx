import { TFunction } from "i18next"
import { createContext, Dispatch, useEffect, useReducer } from "react"

export interface AppStateData {
  loading: boolean
  error?: Error
  token: string
  i18n: {
    translator: TFunction<"translation", undefined>
    lang: string
  }
  account?: {
    name: string
    balance: number
    email: string
    language: string
  }
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
  switch(action.type) {
      case AppReducerActionType.Load:
        return {...previousState, ...{ loading: false, i18n: action.payload.i18n, error: action.payload.error }}
      case AppReducerActionType.Login:
        return {...previousState, ...{ account: { ...action.payload.account }, translator: action.payload.translator }}
      case AppReducerActionType.Logout:
        return {...previousState, ...{ token: '', account: undefined, uiLanguage: 'fr' }}
      default:
        throw new Error(`Unexpected reducer action type ${action.type}`)
  }
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