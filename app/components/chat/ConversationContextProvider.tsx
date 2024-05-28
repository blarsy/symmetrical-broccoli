import DataLoadState, { fromData, initial } from "@/lib/DataLoadState"
import { urlFromPublicId } from "@/lib/images"
import { gql, useLazyQuery } from "@apollo/client"
import { createContext, useState } from "react"
import React from "react"
import { Category, Resource, fromServerGraphResource } from "@/lib/schema"
import { IMessage } from "react-native-gifted-chat"

const MESSAGES_PER_PAGE = 25
const asIMessages = (messages: any[]): IMessage[] => messages.map(msg => asIMessage(msg.node))

export const asIMessage = (msg: any): IMessage => {
  return {
    _id: msg.id,
    text: msg.text,
    createdAt: msg.created,
    user: {
        _id: msg.participantByParticipantId.accountByAccountId.id,
        name: msg.participantByParticipantId.accountByAccountId.name,
        avatar: msg.participantByParticipantId.accountByAccountId.imageByAvatarImageId ?
          urlFromPublicId(msg.participantByParticipantId.accountByAccountId.imageByAvatarImageId.publicId):
          undefined
    },
    image: msg.imageByImageId && urlFromPublicId(msg.imageByImageId.publicId),
    pending: false,
    received: !!msg.received,
    sent: true,
  }
}

export const CONVERSATION_MESSAGES = gql`query ConversationMessages($resourceId: Int!, $otherAccountId: Int!, $after: Cursor, $first: Int!) {
  conversationMessages(
    resourceId: $resourceId
    otherAccountId: $otherAccountId
    first: $first
    after: $after
  ) {
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
  accountById(id: $otherAccountId) {
    id
    name
  }
  resourceById(id: $resourceId) {
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
          publicId
        }
      }
    }
    created
    deleted
  }
}`

export interface ConversationState {
    conversation: DataLoadState<{ 
      messages: IMessage[], 
      resource?: Resource, 
      otherAccount: { id: number, name: string } 
      endCursor: string
    } | undefined>
}

interface ConversationActions {
    load: (resourceId: number, otherAccountId: number, categories: Category[]) => Promise<void>
    loadEarlier: () => Promise<void>
    setMessages: (fn: (prevMessages: IMessage[]) => IMessage[]) => void
}

interface ConversationContext {
    state: ConversationState
    actions: ConversationActions
}

interface Props {
    children: JSX.Element
}

const blankState: ConversationState = {
  conversation: initial(true, {
    messages: [],
    resource: undefined, 
    otherAccount: { id: 0, name: '' },
    endCursor: ''
  })
}

export const ConversationContext = createContext<ConversationContext>({
    state: blankState,
    actions: {
        load: async() => {},
        setMessages: () => [],
        loadEarlier: async () => {}
    }
})

const ConversationContextProvider = ({ children }: Props) => {
    const [getMessages] = useLazyQuery(CONVERSATION_MESSAGES)
    const [conversationState, setConversationState] = useState(blankState)
    
    const actions: ConversationActions = {
        load: async (resourceId: number, otherAccountId: number, categories: Category[]) => {
          const res = await getMessages({ variables: { resourceId: new Number(resourceId), otherAccountId: new Number(otherAccountId), first: MESSAGES_PER_PAGE }})

          if(res.data) {
            const loadedMessages = asIMessages(res.data.conversationMessages.edges)

            setConversationState(prevValue => ({ ...prevValue, ...{ 
              conversation: fromData({ 
                messages: loadedMessages,
                otherAccount: { id: res.data.accountById.id, name: res.data.accountById.name },
                resource: fromServerGraphResource(res.data.resourceById, categories),
                endCursor: res.data.conversationMessages.pageInfo.hasNextPage ? res.data.conversationMessages.pageInfo.endCursor : ''
              })
            }}))
          }
        },
        setMessages: (fn: (prevMessages: IMessage[]) => IMessage[]): void => {
          setConversationState(prevState => {
            const newMessagesList = fn(prevState.conversation.data ? prevState.conversation.data.messages : [])
            
            const newConversationData = { ...prevState.conversation.data, ...{ messages: newMessagesList } }
            return { conversation: fromData( newConversationData ) } as ConversationState
          })
        },
        loadEarlier: async () => {
          if(conversationState.conversation.data) {
            const conversationData = conversationState.conversation.data
            if(conversationData.endCursor) {
              const res = await getMessages({ variables: { resourceId: conversationData.resource?.id,
                otherAccountId: conversationData.otherAccount.id, 
                first: MESSAGES_PER_PAGE,
                after: conversationState.conversation.data.endCursor }})
  
              const nextMessages = asIMessages(res.data.conversationMessages.edges)
    
              setConversationState(prevValue => ({ ...prevValue, ...{ 
                conversation: fromData({ 
                  messages: [...prevValue.conversation.data!.messages, ...nextMessages],
                  otherAccount: prevValue.conversation.data!.otherAccount,
                  resource: prevValue.conversation.data!.resource,
                  endCursor: res.data.conversationMessages.pageInfo.hasNextPage ? res.data.conversationMessages.pageInfo.endCursor : ''
                })
              }}))
            }
          }
        }
    }

    return <ConversationContext.Provider value={{ state: conversationState, actions}}>
        {children}
    </ConversationContext.Provider>
}

export default ConversationContextProvider