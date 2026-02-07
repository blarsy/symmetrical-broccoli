import ClientWrapper from "./ClientWrapper"
import TopBar from "./TopBar"
import { maxLength, PropsWithVersion } from "@/lib/utils"
import { PropsWithChildren, useContext } from "react"
import { AppContext } from "./AppContextProvider"
import Login from "../user/Login"
import { CircularProgress, Container, IconButton, Snackbar, Stack, Typography } from "@mui/material"
import useRealtimeChatMessages from "@/lib/useRealtimeChatMessages"
import { UiContext } from "./UiContextProvider"
import { ChatContext, ChatDispatchContext, ChatReducerActionType } from "./ChatContextProvider"
import { useRouter } from 'next/navigation'
import MarkChatUnreadIcon from '@mui/icons-material/MarkChatUnread'
import Close from '@/app/img/CROSS.svg?react'
import { primaryColor } from "@/utils"

interface Props extends PropsWithVersion {
    allowAnonymous?: boolean
}

const Connected = (p: PropsWithChildren) => {
    useRealtimeChatMessages()

    return p.children
}

export const ConnectContent = (p: Props) => {
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
            <Typography variant="h2" textAlign="center">{uiContext.i18n.translator('pleaseConnectTitle')}</Typography>
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
    const chatDispatch = useContext(ChatDispatchContext)
    const router = useRouter()

    return <Snackbar open={!!chatContext.newChatMessage} key="msg" autoHideDuration={10000} onClose={() => chatDispatch({ type: ChatReducerActionType.DismissNewMessage, payload: undefined })} >
        { chatContext.newChatMessage && <Stack flexDirection="row" padding='0.5rem' alignItems="center" gap="1rem"
            sx={theme => ({ cursor: 'pointer', border: `1px solid ${theme.palette.primary.main}`, backgroundColor: uiContext.lightMode ? '#fff': '#000' }) } 
            borderRadius="1rem">
            <MarkChatUnreadIcon color="primary" />
            <Stack flexDirection="column"
                onClick={() => router.push(`/webapp/${uiContext.version}/chat/${chatContext.newChatMessage!.conversationId}`) }>
                <Typography color="primary" variant="body1">{chatContext.newChatMessage.senderName || uiContext.i18n.translator('deletedAccount')}</Typography>
                <Typography color="primary" variant="body2">{maxLength(chatContext.newChatMessage.text, 150) || '<Image>'}</Typography>
            </Stack>
            <IconButton onClick={() => chatDispatch({ type: ChatReducerActionType.DismissNewMessage, payload: undefined })}>
                <Close fill={primaryColor} width="1rem" />
            </IconButton>
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