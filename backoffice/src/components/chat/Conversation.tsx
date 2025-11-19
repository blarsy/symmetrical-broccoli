import { Stack, SxProps, Theme, Typography } from "@mui/material"
import LoadedZone from "../scaffold/LoadedZone"
import { useContext, useEffect, useState } from "react"
import { AppContext } from "../scaffold/AppContextProvider"
import { gql, useLazyQuery, useMutation } from "@apollo/client"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { Category, fromServerGraphResource } from "@/lib/schema"
import useCategories from "@/lib/useCategories"
import ResourceHeader from "../resources/ResourceHeader"
import { ResourceHeaderyData, ConversationState, Message, NewMessage } from "./lib"
import ConversationMessages from "./ConversationMessages"
import MessageComposer from "./MessageComposer"
import { ChatContext, ChatDispatchContext, ChatReducerActionType } from "../scaffold/ChatContextProvider"
import { UiContext } from "../scaffold/UiContextProvider"
import { urlFromPublicId } from "@/lib/images"
import { useRouter } from "next/navigation"

export const CONVERSATION_MESSAGES = gql`query ConversationMessages($id: Int!, $after: Cursor, $first: Int!) {
    conversationMessagesByConversationId(id: $id, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
        hasPreviousPage
        startCursor
      }
      edges {
        node {
          id
          text
          created
          received
          imageByImageId {
            publicId
          }
          participantByParticipantId {
            id
            accountByAccountId {
              id
              name
              imageByAvatarImageId {
                publicId
              }
            }
          }
        }
        cursor
      }
    }
    conversationById(id: $id){
      id
      participantsByConversationId {
        nodes {
            id
            accountId
            accountByAccountId {
                id
                willingToContribute
                name
                imageByAvatarImageId {
                    publicId
                    id
                }
            }
        }
      }
      resourceByResourceId{
        accountByAccountId {
          email
          id
          name
          imageByAvatarImageId {
            publicId
          }
        }
        canBeDelivered
        canBeExchanged
        canBeGifted
        canBeTakenAway
        description
        id
        isProduct
        isService
        expiration
        title
        resourcesResourceCategoriesByResourceId {
          nodes {
            resourceCategoryCode
          }
        }
        resourcesImagesByResourceId {
          nodes {
            imageByImageId {
              id
              publicId
            }
          }
        }
        locationBySpecificLocationId {
            address
            id
            latitude
            longitude
        }
        created
        suspended
        paidUntil
        deleted
      }
    }
  }`

export const SET_PARTICIPANT_READ = gql`mutation SetParticipantRead($otherAccountId: Int!, $resourceId: Int!) {
  setParticipantRead(
    input: {resourceId: $resourceId, otherAccountId: $otherAccountId}
  ) {
    integer
  }
}`

const asMessages = (messages: any[]): Message[] => messages.map(msg => asMessage(msg.node))
export const asMessage = (msg: any): Message => {
  return {
    id: msg.id,
    text: msg.text,
    createdAt: msg.created,
    user: {
        id: msg.participantByParticipantId.accountByAccountId.id,
        name: msg.participantByParticipantId.accountByAccountId.name,
        avatar: msg.participantByParticipantId.accountByAccountId.imageByAvatarImageId?.publicId
    },
    image: msg.imageByImageId?.publicId,
    received: !!msg.received,
    sent: true,
  }
}

interface Props {
    sx?: SxProps<Theme>
}

interface ConversationDisplayData { 
    conversation: ResourceHeaderyData,
    messages: Message[] 
}

const fromRawConversation = (rawConversation: any, currentAccountId: number, categories: Category[]): ConversationDisplayData => {
    const participantId = rawConversation.conversationById.participantsByConversationId.nodes.find(((part: any) => part.accountId === currentAccountId)).id
    const otherParticipant = rawConversation.conversationById.participantsByConversationId.nodes.find(((part: any) => part.accountId != currentAccountId))
    const rawResource = rawConversation.conversationById.resourceByResourceId
    
    return {
        conversation: {
            id: rawConversation.conversationById.id,
            participantId,
            otherAccount: {
                id: otherParticipant.accountByAccountId.id,
                participantId: otherParticipant.id,
                name: otherParticipant.accountByAccountId.name,
                imagePublicId: otherParticipant.accountByAccountId.imageByAvatarImageId.publicId
            },
            resource: fromServerGraphResource(rawResource, categories)
        },
        messages: asMessages(rawConversation.conversationMessagesByConversationId.edges.toReversed())
    }
}

const Conversation = (p: Props) => {
    const appContext = useContext(AppContext)
    const uiContext = useContext(UiContext)
    const chatContext = useContext(ChatContext)
    const chatDispatch = useContext(ChatDispatchContext)
    const [getConversation] = useLazyQuery(CONVERSATION_MESSAGES)
    const categories = useCategories()
    const [conversationData, setConversationData] = useState<ConversationState>(initial(false))
    const [setParticipantRead] = useMutation(SET_PARTICIPANT_READ)
    const [currentMessages, setCurrentMessages] = useState<Message[]>()
    const [conversationHasNewMessages, setConversationHasNewMessages] = useState(false)
    const router = useRouter()

    const loadConversation = async (id: number) => {
        setConversationData(initial(true))
        try {
            const res = await getConversation({ variables: { id, first: 50 } })
            const conversationData = fromRawConversation(res.data, appContext.account!.id, categories.data!)
            setConversationData(fromData(conversationData))
            setCurrentMessages(conversationData.messages)
            setParticipantRead({ variables: {
              resourceId: conversationData.conversation.resource?.id, 
              otherAccountId: conversationData.conversation.otherAccount.id
            } })
            setTimeout(() => {
              chatDispatch({ type: ChatReducerActionType.SetConversationRead, payload: conversationData.conversation.id })
            }, 0)
        } catch (e) {
            setConversationData(fromError(e, uiContext.i18n.translator('requestError')))
        }
    }

    const handleMessageOnCurrentConversation = (rawMsg: any) => {
      if(rawMsg && rawMsg.participantByParticipantId.conversationByConversationId.id === chatContext.currentConversationId ) {
        setCurrentMessages(prev => ([ ...(prev || []), asMessage(rawMsg) ]))
        setConversationHasNewMessages(true)
      }
    }

    useEffect(() => {
        if(uiContext.categories.data) {
          if(chatContext.newConversationState) {
            setCurrentMessages([])
            const newConversationState: ConversationDisplayData = {
              conversation: {
                id: -1,
                otherAccount: {
                  id: chatContext.newConversationState.resource.account!.id,
                  name: chatContext.newConversationState.resource.account!.name,
                  imagePublicId: chatContext.newConversationState.resource.account!.avatarImagePublicId && urlFromPublicId(chatContext.newConversationState.resource.account!.avatarImagePublicId),
                  participantId: 0
                },
                participantId: 0,
                resource: chatContext.newConversationState.resource
              },
              messages: []
            }
            setConversationData(fromData(newConversationState))
            return
          }
          if(chatContext.currentConversationId) {
            loadConversation(chatContext.currentConversationId)
            chatDispatch({ type: ChatReducerActionType.SetChatMessageCustomHandler, payload: handleMessageOnCurrentConversation })
            
            return () => {
              chatDispatch({ type: ChatReducerActionType.SetChatMessageCustomHandler, payload: undefined })
            }
          }
        }
    }, [chatContext.currentConversationId, chatContext.newConversationState, uiContext.categories.data])

    return <Stack sx={p.sx}>
        { chatContext.currentConversationId || chatContext.newConversationState ?
            <LoadedZone loading={conversationData?.loading} error={conversationData?.error} containerStyle={{ maxHeight: '100%', flex: '1' }}>
                { conversationData.data && [
                    <ResourceHeader key="header" sx={{ borderTop: '1px solid #ccc', borderBottom: '1px solid #ccc' }} 
                      data={conversationData.data!.conversation} 
                      onAccountClicked={() => router.push(`/webapp/${uiContext.version}/account/${conversationData.data!.conversation.otherAccount!.id}`)}
                      onResourceClicked={() => router.push(`/webapp/${uiContext.version}/view/${conversationData.data!.conversation.resource!.id}`)} />,
                    <ConversationMessages hasNew={conversationHasNewMessages} key="messages" data={currentMessages!} 
                      onBottom={() => setConversationHasNewMessages(false)}/>,
                    <MessageComposer key="composer" conversation={conversationData.data.conversation} 
                      onMessageSent={(id, text, imagePublicId) => {
                        const newMessage = {
                          createdAt: new Date(), text, image: imagePublicId, 
                          user: { id: appContext.account!.id, name: appContext.account!.name, avatar: appContext.account!.avatarPublicId },
                          id
                        }
                        setCurrentMessages(prev => ([ ...(prev || []), newMessage]))
                        chatDispatch({ type: ChatReducerActionType.SetNewChatMessage, payload: {
                          conversationId: conversationData.data?.conversation.id,
                          created: new Date(),
                          resourceId: conversationData.data?.conversation.resource?.id,
                          resourceName: conversationData.data?.conversation.resource?.title,
                          senderName: appContext.account!.name,
                          text,
                          resourceImage: (conversationData.data?.conversation.resource?.images && conversationData.data?.conversation.resource?.images.length > 0) ? conversationData.data?.conversation.resource?.images[0].publicId : '',
                          image: imagePublicId,
                          senderImage: appContext.account!.avatarPublicId
                        } as NewMessage })
                        setConversationHasNewMessages(true)
                      }}/>
                ]}
            </LoadedZone>
        :
            <Typography color="primary" variant="overline" align="center">{uiContext.i18n.translator('noConversationSelected')}</Typography>
        }
    </Stack>
}

export default Conversation