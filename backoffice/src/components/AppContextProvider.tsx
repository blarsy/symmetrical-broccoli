import { createContext, useState } from "react"

interface AppStateData {
  account: {
    name: string,
    balance: number,
    email: string
  }
}

export interface AppContext {
  data: AppStateData
}
interface Props {
  children: JSX.Element
}

const blankAppContext = { data: { 
    account: {
        name: '',
        balance: 0,
        email: ''
    }
  },
  loggedIn: () => {}
} as AppContext
export const AppContext = createContext<AppContext>(blankAppContext)

const AppContextProvider = ({ children }: Props) => {
    const [appState, setAppState] = useState(blankAppContext.data)

    return <AppContext.Provider value={{ data: appState }}>
        {children}
    </AppContext.Provider>
}

export default AppContextProvider