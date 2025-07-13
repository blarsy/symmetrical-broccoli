import { gql, useQuery } from "@apollo/client"
import LoadedZone from "../scaffold/LoadedZone"
import { Stack, SxProps, Theme, Typography } from "@mui/material"
import { useContext, useEffect } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import { maxLength } from "@/lib/utils"
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { ConversationData } from "./lib"
import ResourceImage from "../ResourceImage"
import { ChatContext, ChatDispatchContext, ChatReducerActionType } from "../scaffold/ChatContextProvider"
import { UiContext } from "../scaffold/UiContextProvider"

export const MY_CONVERSATIONS = gql`query MyConversations {
  myConversations {
    nodes {
      id
      created
      messageByLastMessage {
        text
        created
      }
      participantsByConversationId {
        nodes {
          id
          unreadMessagesByParticipantId {
            totalCount
          }
          accountByAccountId {
            id
            name
            email
            imageByAvatarImageId {
              publicId
            }
          }
          conversationId
        }
      }
      resourceByResourceId {
        id
        canBeGifted
        canBeExchanged
        title
        accountByAccountId {
          name
          id
          email
          imageByAvatarImageId {
            publicId
          }
        }
        resourcesImagesByResourceId {
          nodes {
            imageByImageId {
              publicId
            }
          }
        }
      }
    }
  }
}`

const getConversationData = (rawConv:any, currentAccountId: number): ConversationData => {
    const rawRes = rawConv.resourceByResourceId
    const rawParticipants = rawConv.participantsByConversationId.nodes
    const otherParticipant = rawParticipants.find((participant: any) => participant.accountByAccountId.id != currentAccountId)

    return {
        id: rawConv.id, accountName: otherParticipant.accountByAccountId.name,
        resourceId: rawRes.id, resourceImagePublicId: rawConv.resourceByResourceId.resourcesImagesByResourceId?.nodes?.length > 0 && rawConv.resourceByResourceId.resourcesImagesByResourceId?.nodes[0].imageByImageId?.publicId,
        resourceName: rawRes.title,
        imagePublicId: otherParticipant.accountByAccountId.imageByAvatarImageId?.publicId, 
        numberOfUnreadMessages: otherParticipant.unreadMessagesByParticipantId.totalCount,
        lastMessage: rawConv.messageByLastMessage?.text,
        lastMessageDate: rawConv.messageByLastMessage?.created
    }
}

interface Props {
    sx?: SxProps<Theme>
    currentConversation?: number
    onConversationSelected: (newConversationId: number, currentConversationId?: number) => void
}

interface ConversationCardProps {
  conversation: ConversationData
  onSelect: (newConversationId: number, currentConversationId?: number) => void
}

const ConversationCard = (p: ConversationCardProps) => {
  const uiContext = useContext(UiContext)
  const chatContext = useContext(ChatContext)
  const chatDispatch = useContext(ChatDispatchContext)
  const hasUnread = chatContext.unreadConversations.includes(p.conversation.id)

  const isSelected = chatContext.newConversationState ? (p.conversation.id === -1) : (p.conversation.id === chatContext.currentConversationId)

  return <Stack direction="row" gap="0.5rem"
      sx={theme => ({ 
        cursor: 'pointer', 
        backgroundColor: isSelected ? theme.palette.primary.contrastText : 'initial',
        alignItems: 'center'
      })} onClick={ () => {
        chatDispatch({ type: ChatReducerActionType.SetCurrentConversationId, payload: p.conversation.id })
        p.onSelect(p.conversation.id, chatContext.currentConversationId)
      } }>
      <ResourceImage accountImagePublicId={p.conversation.imagePublicId} baseWidth={120}
        accountName={p.conversation.accountName} resourceImagePublicId={p.conversation.resourceImagePublicId} />
      <Stack alignSelf="flex-start" flex="1">
          <Typography color="primary" variant="overline" sx={{ fontWeight: hasUnread ? "bolder" : undefined }}>{p.conversation.accountName || uiContext.i18n.translator('deletedAccount')}</Typography>
          <Typography color="primary" variant="caption">{p.conversation.resourceName}</Typography>
          <Typography color="primary" variant="body1" sx={{ fontWeight: hasUnread ? "bolder" : undefined }}>{ maxLength(p.conversation.lastMessage, 50) }</Typography>
      </Stack>
      { hasUnread && <FiberManualRecordIcon color="primary" /> }
  </Stack>
}

const Conversations = (p: Props) => {
    const { data, loading, error }= useQuery(MY_CONVERSATIONS)
    const appContext = useContext(AppContext)
    const uiContext = useContext(UiContext)
    const chatDispatch = useContext(ChatDispatchContext)
    const chatContext = useContext(ChatContext)

    useEffect(() => {
      if(data) {
        const conversationsInDb = data.myConversations.nodes.toReversed().map((rawConv: any) => getConversationData(rawConv, appContext.account!.id))
        let conversations: ConversationData[] = []
        
        if(chatContext.newConversationState) {
          conversations = [{ 
            accountName: chatContext.newConversationState.resource.account!.name,
            id: -1,
            numberOfUnreadMessages: 0,
            resourceId: chatContext.newConversationState.resource.id,
            resourceName: chatContext.newConversationState.resource.title,
            imagePublicId: chatContext.newConversationState.resource.account!.avatarImageUrl,
            resourceImagePublicId: chatContext.newConversationState.resource.images.length > 0 ?
              chatContext.newConversationState.resource.images[0].publicId:
              undefined
           }, ...conversationsInDb]
        } else {
          conversations = conversationsInDb
        }
        chatDispatch({ type: ChatReducerActionType.SetConversations, payload: conversations })
      }
    }, [data])

    return <LoadedZone loading={loading} error={error} containerStyle={[{
      padding: '0.5rem',
      overflow: 'auto'
    }, ...(Array.isArray(p.sx) ? p.sx : [p.sx])]}>
        { data && data.myConversations.nodes.length === 0 && 
          <Typography color="primary" variant="caption">{uiContext.i18n.translator('noConversationYet')}</Typography>
        }
        { chatContext.conversations && chatContext.conversations.map((conv, idx) => <ConversationCard key={idx}
          conversation={conv}
          onSelect={p.onConversationSelected} />)
        }
    </LoadedZone>
}

export default Conversations