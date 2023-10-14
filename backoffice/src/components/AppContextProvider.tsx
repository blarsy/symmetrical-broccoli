import { Account } from "@/schema"
import { createContext, useState } from "react"

interface AppStateData {
  account: {
    name: string,
    balance: number,
    email: string
  }
}

export interface AppContext {
  data: AppStateData,
  loggedIn: (account: Account) => void
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

    const loggedIn = (account: Account): void => {
      console.log(account)
      setAppState({ ...appState, ...{ account } })
    }

    return <AppContext.Provider value={{ data: appState, loggedIn }}>
        {children}
    </AppContext.Provider>
}

export default AppContextProvider