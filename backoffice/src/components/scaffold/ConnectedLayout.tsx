import ClientWrapper from "./ClientWrapper"
import TopBar from "./TopBar"
import { PropsWithVersion } from "@/lib/utils"
import { PropsWithChildren, useContext } from "react"
import { AppContext } from "./AppContextProvider"
import Login from "../user/Login"
import { CircularProgress, Container, Snackbar, Stack, Typography } from "@mui/material"
import useRealtimeChatMessages from "@/lib/useRealtimeChatMessages"
import { UiContext } from "./UiContextProvider"
import { ChatContext } from "./ChatContextProvider"
import { useRouter } from 'next/navigation'

interface Props extends PropsWithVersion {
    allowAnonymous?: boolean
}

const Connected = (p: PropsWithChildren) => {
    useRealtimeChatMessages()

    return p.children
}

const ConnectContent = (p: Props) => {
    const appContext = useContext(AppContext)
    const uiContext = useContext(UiContext)

    if(uiContext.loading || appContext.loading) {
        return <Stack sx={{ flex: 1, alignItems: 'center', paddingTop: '2rem' }}>
            <CircularProgress color="primary" />
        </Stack>
    }

    if(!appContext.account && !p.allowAnonymous) {
        return <>
            <TopBar version={ p.version }/>
            <Container maxWidth="lg" sx={{ padding: '1rem' }}>
                <Login version={p.version} />
            </Container>
        </>
    } else if(!appContext.account) {
        return <>
            <TopBar version={ p.version }/>
            {p.children}
        </>
    } else {
        return <Connected>
            <TopBar version={ p.version }/>
            {p.children}
            <ChatMessageSnackbar />
        </Connected>
    }
}

const ChatMessageSnackbar = () => {
    const uiContext = useContext(UiContext)
    const chatContext = useContext(ChatContext)
    const router = useRouter()

    return <Snackbar open={!!chatContext.newChatMessage} key="msg" autoHideDuration={10000} >
        { chatContext.newChatMessage && <Stack flexDirection="column" padding="0.5rem" 
            sx={theme => ({ backgroundColor: theme.palette.primary.contrastText }) }
            onClick={() => router.push(`/webapp/${uiContext.version}/chat/${chatContext.newChatMessage!.conversationId}`) }>
            <Typography color="primary" variant="body1">{chatContext.newChatMessage.senderName || uiContext.i18n.translator('deletedAccount')}</Typography>
            <Typography color="primary" variant="body2">{chatContext.newChatMessage.text || '<Image>'}</Typography>
        </Stack> }
    </Snackbar>
}

export const ConnectedLayout = (p: Props) => {
    return <ClientWrapper version={ p.version }>
        <ConnectContent version={p.version} allowAnonymous={p.allowAnonymous}>
            {p.children}
        </ConnectContent>
    </ClientWrapper>
}

export default ConnectedLayout