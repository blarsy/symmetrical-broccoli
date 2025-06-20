import { Stack, SxProps } from "@mui/material"
import Conversations from "./Conversations"
import Conversation from "./Conversation"
import { Theme } from "@emotion/react"
import { useContext, useEffect } from "react"
import { ChatContext, ChatDispatchContext, ChatReducerActionType } from "../scaffold/ChatContextProvider"

interface Props {
    sx?: SxProps<Theme>
    onConversationSelected: (target: number, current?: number) => void
    conversationId?: number
}

const Chat = (p: Props) => {
    const chatContext = useContext(ChatContext)
    const chatDispatch = useContext(ChatDispatchContext)

    useEffect(() => {
        if(chatContext.currentConversationId != p.conversationId) {
            chatDispatch({ type: ChatReducerActionType.SetCurrentConversationId, payload: p.conversationId })
        }
    }, [])
    
    return <Stack direction="row" flex="1" sx={p.sx}>
        <Conversations onConversationSelected={p.onConversationSelected} sx={{ flex: '0 0 30%', borderRight: '1px solid #ccc', borderTop: '1px solid #ccc', maxHeight: '100%' }}/>
        <Conversation sx={{ flex: '0 0 70%', maxHeight: '100%', borderTop: '1px solid #ccc' }}/>
    </Stack>
}

export default Chat