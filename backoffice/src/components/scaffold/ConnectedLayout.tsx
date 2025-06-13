import ClientWrapper from "./ClientWrapper"
import TopBar from "./TopBar"
import { PropsWithVersion } from "@/lib/utils"
import { useContext } from "react"
import { AppContext } from "./AppContextProvider"
import Login from "../user/Login"
import { Stack } from "@mui/material"

interface Props extends PropsWithVersion {
    allowAnonymous?: boolean
}

const ConnectContent = (p: Props) => {
    const appContext = useContext(AppContext)

    if(!appContext.account && !p.allowAnonymous) {
        return <>
            <TopBar version={ p.version }/>
            <Stack padding="1rem">
                <Login version={p.version} />
            </Stack>
        </>
    } else {
        return <>
            <TopBar version={ p.version }/>
            {p.children}
        </>
    }
}

export const ConnectedLayout = (p: Props) => {
    return <ClientWrapper version={ p.version }>
        <ConnectContent version={p.version} allowAnonymous={p.allowAnonymous}>
            {p.children}
        </ConnectContent>
    </ClientWrapper>
}

export default ConnectedLayout