import { Container } from "@mui/material"
import ClientWrapper from "./ClientWrapper"
import TopBar from "./TopBar"
import { PropsWithVersion } from "@/lib/utils"
import { useContext } from "react"
import { AppContext } from "./AppContextProvider"
import ConnectForm from "../user/ConnectForm"

interface Props extends PropsWithVersion {
    allowAnonymous?: boolean
}

const ConnectContent = (p: Props) => {
    const appContext = useContext(AppContext)

    if(!appContext.account && !p.allowAnonymous) {
        return <Container maxWidth="xl">
            <TopBar version={ p.version }/>
            <ConnectForm onClose={() => {}} version={p.version}/>
        </Container>
    } else 
        return <Container maxWidth="xl">
            <TopBar version={ p.version }/>
            { p.children }
        </Container>
}

export const ConnectedLayout = (p: Props) => {
    return <ClientWrapper version={ p.version }>
        <ConnectContent version={p.version} allowAnonymous={p.allowAnonymous}>
            {p.children}
        </ConnectContent>
    </ClientWrapper>
}

export default ConnectedLayout