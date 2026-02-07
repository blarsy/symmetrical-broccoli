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
import { v4 } from "uuid"

export const MY_CONVERSATIONS = gql`query MyConversations {
  myConversations {
    nodes {
      id
      created
      participantsByConversationId {
        nodes {
          id
          unreadMessagesByParticipantId {
            totalCount
          }
          accountsPublicDatumByAccountId {
            id
            name
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
        accountsPublicDatumByAccountId {
          name
          id
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
      messageByLastMessageId {
        text
        created
      }
    }
  }
}`

const getConversationData = (rawConv:any, currentAccountId: string): ConversationData => {
    const rawRes = rawConv.resourceByResourceId
    const rawParticipants = rawConv.participantsByConversationId.nodes
    const otherParticipant = rawParticipants.find((participant: any) => participant.accountsPublicDatumByAccountId.id != currentAccountId)

    return {
        id: rawConv.id, accountName: otherParticipant.accountsPublicDatumByAccountId.name,
        resourceId: rawRes.id, resourceImagePublicId: rawConv.resourceByResourceId.resourcesImagesByResourceId?.nodes?.length > 0 && rawConv.resourceByResourceId.resourcesImagesByResourceId?.nodes[0].imageByImageId?.publicId,
        resourceName: rawRes.title,
        imagePublicId: otherParticipant.accountsPublicDatumByAccountId.imageByAvatarImageId?.publicId, 
        numberOfUnreadMessages: otherParticipant.unreadMessagesByParticipantId.totalCount,
        lastMessage: rawConv.messageByLastMessageId?.text,
        lastMessageDate: rawConv.messageByLastMessageId?.created
    }
}

interface Props {
    sx?: SxProps<Theme>
    currentConversation?: number
    onConversationSelected: (newConversationId: string, currentConversationId?: string) => void
}

interface ConversationCardProps {
  conversation: ConversationData
  onSelect: (newConversationId: string, currentConversationId?: string) => void
}

const ConversationCard = (p: ConversationCardProps) => {
  const uiContext = useContext(UiContext)
  const chatContext = useContext(ChatContext)
  const chatDispatch = useContext(ChatDispatchContext)
  const hasUnread = chatContext.unreadConversations.includes(p.conversation.id)

  const isSelected = p.conversation.id === chatContext.currentConversationId

  return <Stack direction="row" gap="0.5rem"
      sx={theme => ({ 
        cursor: 'pointer', 
        backgroundColor: isSelected ? theme.palette.primary.light : 'initial',
        borderRadius: '0.5rem',
        padding: `0.5rem 0`,
        alignItems: 'center'
      })} onClick={ () => {
        chatDispatch({ type: ChatReducerActionType.SetCurrentConversationId, payload: p.conversation.id })
        p.onSelect(p.conversation.id, chatContext.currentConversationId)
      } }>
      <ResourceImage accountImagePublicId={p.conversation.imagePublicId} baseWidth={120}
        accountName={p.conversation.accountName} resourceImagePublicId={p.conversation.resourceImagePublicId} />
      <Stack alignSelf="flex-start" flex="1">
          <Typography color={theme => isSelected ? theme.palette.primary.contrastText : theme.palette.primary.main } variant="overline" sx={{ fontWeight: hasUnread ? "bolder" : undefined }} lineHeight={1.2}>{p.conversation.accountName || uiContext.i18n.translator('deletedAccount')}</Typography>
          <Typography color={theme => isSelected ? theme.palette.primary.contrastText : theme.palette.primary.main } variant="caption">{p.conversation.resourceName}</Typography>
          <Typography color={theme => isSelected ? theme.palette.primary.contrastText : theme.palette.primary.main } variant="body1" sx={{ fontWeight: hasUnread ? "bolder" : undefined }}>{ maxLength(p.conversation.lastMessage, 50) }</Typography>
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
          const otherAccount = chatContext.newConversationState.withAccount || chatContext.newConversationState.resource.account!
          conversations = [{ 
            accountName: otherAccount.name,
            id: v4(),
            numberOfUnreadMessages: 0,
            resourceId: chatContext.newConversationState.resource.id,
            resourceName: chatContext.newConversationState.resource.title,
            imagePublicId: otherAccount.avatarImagePublicId,
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
        { data && data.myConversations.nodes.length + chatContext.conversations.length === 0 && 
          <Typography color="primary" variant="caption">{uiContext.i18n.translator('noConversationYet')}</Typography>
        }
        { chatContext.conversations && chatContext.conversations.map((conv, idx) => <ConversationCard key={idx}
          conversation={conv}
          onSelect={p.onConversationSelected} />)
        }
    </LoadedZone>
}

export default Conversations