import { Stack, SxProps } from "@mui/material"
import Conversations from "./Conversations"
import Conversation from "./Conversation"
import { Theme } from "@emotion/react"
import { useState } from "react"

interface Props {
    sx?: SxProps<Theme>
    conversationId?: number
    onConversationSelected: (conversationId: number) => void
}

const Chat = (p: Props) => {
    const [conversationId, setConverationId] = useState(p.conversationId)
    return <Stack direction="row" flex="1" sx={p.sx}>
        <Conversations onConversationSelected={id => {
            setConverationId(id)
            p.onConversationSelected(id)
        }} sx={{ flex: '0 0 30%', borderRight: '1px solid #555', borderTop: '1px solid #555', maxHeight: '100%' }}/>
        <Conversation conversationId={conversationId} sx={{ flex: '0 0 70%', maxHeight: '100%' }}/>
    </Stack>
}

export default Chat