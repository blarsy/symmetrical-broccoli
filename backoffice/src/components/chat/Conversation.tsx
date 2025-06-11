import { Stack, SxProps, Theme, Typography } from "@mui/material"
import LoadedZone from "../scaffold/LoadedZone"
import { useContext, useEffect, useState } from "react"
import { AppContext, AppDispatchContext, AppReducerActionType } from "../scaffold/AppContextProvider"
import { gql, useLazyQuery, useMutation } from "@apollo/client"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { Category, fromServerGraphResource } from "@/lib/schema"
import useCategories from "@/lib/useCategories"
import ConversationHeader from "./ConversationHeader"
import { ConversationDisplayData, ConversationState, Message } from "./lib"
import ConversationMessages from "./ConversationMessages"
import MessageComposer from "./MessageComposer"
import { createMessageHandler } from "@/lib/useAccountFunctions"
import { Subscription } from "zen-observable-ts"

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
    conversationId?: number
}

const fromRawConversation = (rawConversation: any, currentAccountId: number, categories: Category[]): { conversation: ConversationDisplayData, messages: Message[] } => {
    const otherParticipant = rawConversation.conversationById.participantsByConversationId.nodes.find(((part: any) => part.accountId != currentAccountId))
    const rawResource = rawConversation.conversationById.resourceByResourceId
    
    return {
        conversation: {
            id: rawConversation.conversationById.id,
            participantId: otherParticipant.id,
            otherAccount: {
                id: otherParticipant.accountByAccountId.id,
                name: otherParticipant.accountByAccountId.name,
                willingToContribute: otherParticipant.accountByAccountId.willingToContribute,
                imagePublicId: otherParticipant.accountByAccountId.imageByAvatarImageId.publicId
            },
            resource: fromServerGraphResource(rawResource, categories)
        },
        messages: asMessages(rawConversation.conversationMessagesByConversationId.edges.toReversed())
    }
}

const Conversation = (p: Props) => {
    const appContext = useContext(AppContext)
    const appDispatch = useContext(AppDispatchContext)
    const [getConversation] = useLazyQuery(CONVERSATION_MESSAGES)
    const categories = useCategories()
    const [conversationData, setConversationData] = useState<ConversationState>(initial(false))
    const [setParticipantRead] = useMutation(SET_PARTICIPANT_READ)
    const [currentMessages, setCurrentMessages] = useState<Message[]>()

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
              appDispatch({ type: AppReducerActionType.SetConversationRead, payload: conversationData.conversation.participantId })
            })
        } catch (e) {
            setConversationData(fromError(e, appContext.i18n.translator('requestError')))
        }
    }

    const setMessageSubscription = (handler: (raw: any) => void) => {
      appContext.messageSubscription?.unsubscribe()
      const newSubscription = appContext.messageSubscriber?.subscribe(handler)
      appDispatch({ type: AppReducerActionType.SetMessageReceivedHandler, payload: newSubscription })
    }

    const handleMessageOnCurrentConversation = (rawMsg: any) => {
        console.log('examining msg', rawMsg)
        if(rawMsg.data.messageReceived.message.participantByParticipantId.conversationByConversationId.id === p.conversationId ) {
          setCurrentMessages(prev => ([ ...(prev || []), asMessage(rawMsg.data.messageReceived.message) ]))
        } else {
          createMessageHandler(appDispatch)(rawMsg.data.messageReceived.message)
        }
      }

    useEffect(() => {
        if(p.conversationId && appContext.categories.data) {
            loadConversation(p.conversationId)
            setMessageSubscription(handleMessageOnCurrentConversation)
            return () => {
              setMessageSubscription(createMessageHandler(appDispatch))
            }
        }
    }, [p.conversationId, appContext.categories.data])

    return <Stack sx={p.sx}>
        { p.conversationId ?
            <LoadedZone loading={conversationData?.loading} error={conversationData?.error} containerStyle={{ maxHeight: '100%', flex: '1' }}>
                { conversationData.data && [
                    <ConversationHeader key="header" sx={{ borderTop: '1px solid #555', borderBottom: '1px solid #555' }} data={conversationData.data!.conversation}  />,
                    <ConversationMessages key="messages" data={currentMessages!} />,
                    <MessageComposer key="composer" conversation={conversationData.data.conversation} />
                ]}
            </LoadedZone>
        :
            <Typography variant="overline" align="center">{appContext.i18n.translator('noConversationSelected')}</Typography>
        }
    </Stack>
}

export default Conversation