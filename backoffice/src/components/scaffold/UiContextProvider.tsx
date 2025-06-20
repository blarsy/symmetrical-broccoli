import { createContext, Dispatch, Key, useReducer } from "react"
import { Category } from "@/lib/schema"
import DataLoadState, { initial } from "@/lib/DataLoadState"

export interface UiStateData {
  loading: boolean
  error?: Error
  version: string
  i18n: {
    translator: (str: string | Key | string[] | Key[], opts?: any) => string
    lang: string
  }
  lightMode?: boolean
  categories: DataLoadState<Category[]>
}

const blankUiContext = { 
    loading: true,
    categories: initial<Category[]>(false, undefined),
    version: '',
    i18n: {
      translator: (code) => `tr-${code}`,
      lang: ''
    },
} as UiStateData

export enum UiReducerActionType {
  Load,
  SwitchLightMode,
  SetCategoriesState,
  SetConnectingStatus
}

const uiReducer = (previousState: UiStateData, action: { type: UiReducerActionType, payload: any }): UiStateData => {
  let newState : any
  switch(action.type) {
      case UiReducerActionType.Load:
        newState = { loading: false, i18n: action.payload.i18n, error: action.payload.error, version: action.payload.version, lightMode: action.payload.lightMode }
        break
      case UiReducerActionType.SwitchLightMode:
        newState = { lightMode: !previousState.lightMode }
        break
      case UiReducerActionType.SetCategoriesState:
        newState = { categories: action.payload }
        break
      default:
        throw new Error(`Unexpected reducer action type ${action.type}`)
  }

  return {...previousState, ...newState}
}

export const UiContext = createContext<UiStateData>(blankUiContext)
export const UiDispatchContext = createContext((() => {}) as Dispatch<{ type: UiReducerActionType, payload: any }>)

interface Props {
    children: JSX.Element
    initial?: UiStateData
}
const UiContextProvider = ({ children, initial }: Props) => {
    const [uiState, dispatch] = useReducer<(previousState: UiStateData, action: { type: UiReducerActionType, payload: any }) => UiStateData>(uiReducer, initial || blankUiContext)

    return <UiContext.Provider value={uiState}>
        <UiDispatchContext.Provider value={dispatch}>
            {children}
        </UiDispatchContext.Provider>
    </UiContext.Provider>
}

export default UiContextProvider