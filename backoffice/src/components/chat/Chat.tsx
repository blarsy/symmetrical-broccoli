import { Stack, SxProps } from "@mui/material"
import Conversations from "./Conversations"
import Conversation from "./Conversation"
import { Theme } from "@emotion/react"
import { useContext, useEffect, useState } from "react"
import { ChatContext, ChatDispatchContext, ChatReducerActionType } from "../scaffold/ChatContextProvider"
import { gql, useLazyQuery } from "@apollo/client"
import { GET_RESOURCE } from "@/lib/apolloClient"
import { fromServerGraphResource } from "@/lib/schema"
import { UiContext } from "../scaffold/UiContextProvider"
import LoadedZone from "../scaffold/LoadedZone"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"

const GET_CONVERSATION_FOR_RESOURCE = gql`query GetConversationForResource($resourceId: Int) {
  getConversationForResource(resourceId: $resourceId) {
    id
  }
}`

interface Props {
    sx?: SxProps<Theme>
    onConversationSelected: (target: number, current?: number) => void
    conversationId?: number
    resourceId?: number
}

const Chat = (p: Props) => {
    const chatContext = useContext(ChatContext)
    const chatDispatch = useContext(ChatDispatchContext)
    const uiContext = useContext(UiContext)
    const [getResource] = useLazyQuery(GET_RESOURCE)
    const [getConversationForResource] = useLazyQuery(GET_CONVERSATION_FOR_RESOURCE)
    const [loadState, setLoadState] = useState<DataLoadState<null>>(initial(false))

    const loadNewConversation = async () => {
        try {
            setLoadState(initial(true))
            const conv = await getConversationForResource({ variables: { resourceId: p.resourceId } })
            if(conv.data.getConversationForResource) {
                chatDispatch({ type: ChatReducerActionType.SetCurrentConversationId, payload: conv.data.getConversationForResource.id })
            } else {
                const res = await getResource({ variables: { id: p.resourceId } })
                chatDispatch({ 
                    type: ChatReducerActionType.SetNewConversation,
                    payload: fromServerGraphResource(res.data.resourceById, uiContext.categories.data!) 
                })
            }
            setLoadState(fromData(null))
        } catch(e) {
            setLoadState(fromError(e, uiContext.i18n.translator('requestError')))
        }
    }

    useEffect(() => {
        if(p.resourceId && uiContext.categories.data) {
            loadNewConversation()
        } else {            
            if(chatContext.currentConversationId != p.conversationId) {
                chatDispatch({ type: ChatReducerActionType.SetCurrentConversationId, payload: p.conversationId })
            }
        }
    }, [uiContext.categories.data])
    
    return <LoadedZone loading={loadState.loading} error={loadState.error} containerStyle={[ { overflow: 'auto' }, ...(Array.isArray(p.sx) ? p.sx : [p.sx])]}>
        <Stack direction="row" flex="1" maxHeight="100%">
            <Conversations onConversationSelected={p.onConversationSelected} sx={{ flex: '0 0 30%', borderRight: '1px solid #ccc', borderTop: '1px solid #ccc', maxHeight: '100%' }}/>
            <Conversation sx={{ flex: '0 0 70%', maxHeight: '100%', borderTop: '1px solid #ccc' }}/>
        </Stack>
    </LoadedZone>
}

export default Chat