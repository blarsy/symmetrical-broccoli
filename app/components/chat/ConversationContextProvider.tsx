import DataLoadState, { fromError, fromData, initial } from "@/lib/DataLoadState"
import { gql, useLazyQuery } from "@apollo/client"
import { createContext, useState } from "react"
import React from "react"
import { Category, Resource, fromServerGraphResource } from "@/lib/schema"
import { t } from "@/i18n"
import { IMessage } from "./Chat"

export const MESSAGES_PER_PAGE = 25
const asIMessages = (messages: any[]): IMessage[] => messages.map(msg => asIMessage(msg.node))

export const asIMessage = (msg: any): IMessage => {
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
          id
          accountByAccountId {
            id
            name
            imageByAvatarImageId {
              publicId
            }
          }
          conversationByConversationId {
            id
          }
        }
      }
      cursor
    }
  }
  accountById(id: $otherAccountId) {
    id
    name
    imageByAvatarImageId {
      publicId
    }
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
    suspended
    paidUntil
    deleted
  }
}
`

export interface ConversationState extends DataLoadState<{ 
      id: number
      participantId: number
      resource?: Resource
      otherAccount: { id: number, name: string } 
} | undefined> {}

export interface conversationMessagesState {
    endCursor: string
    messages: DataLoadState<IMessage[]>
    loadingEarlier: boolean
}

interface ConversationActions {
    load: (resourceId: number, otherAccountId: number, categories: Category[]) => Promise<void>
    loadEarlier: () => Promise<void>
    setMessages: (fn: (prevMessages: IMessage[]) => IMessage[]) => void
}

interface ConversationContext {
    conversationState: ConversationState
    messagesState: conversationMessagesState
    actions: ConversationActions
}

interface Props {
    children: JSX.Element
}

const blankConversationState: ConversationState = initial(true, {
  id: 0,
  participantId: 0,
  resource: undefined, 
  otherAccount: { id: 0, name: '', avatarPublicId: '' }
})

const blankMessagesState: conversationMessagesState = {
  endCursor: '',
  messages: initial(true, []),
  loadingEarlier: false
}

export const ConversationContext = createContext<ConversationContext>({
    conversationState: blankConversationState,
    messagesState: blankMessagesState,
    actions: {
        load: async() => {},
        setMessages: () => [],
        loadEarlier: async () => {}
    }
})

const ConversationContextProvider = ({ children }: Props) => {
    const [getMessages] = useLazyQuery(CONVERSATION_MESSAGES)
    const [conversationState, setConversationState] = useState(blankConversationState)
    const [messagesState, setMessagesState] = useState(blankMessagesState)
    
    const actions: ConversationActions = {
        load: async (resourceId: number, otherAccountId: number, categories: Category[]) => {
          try {
            const res = await getMessages({ variables: { resourceId: new Number(resourceId), otherAccountId: new Number(otherAccountId), first: MESSAGES_PER_PAGE }})
    
            if(res.data) {
              const loadedMessages = fromData(asIMessages(res.data.conversationMessages.edges))

              setConversationState(fromData({ 
                  id: res.data.conversationMessages.edges.length > 0 ? 
                    res.data.conversationMessages.edges[0].node.participantByParticipantId.conversationByConversationId.id :
                    -1,
                  participantId: res.data.conversationMessages.edges.length > 0 ? 
                    res.data.conversationMessages.edges[0].node.participantByParticipantId.id :
                    -1,
                  otherAccount: { id: res.data.accountById.id, name: res.data.accountById.name, avatarPublicId: res.data.accountById.imageByAvatarImageId?.publicId },
                  resource: fromServerGraphResource(res.data.resourceById, categories)
                }
              ))
              setMessagesState({
                endCursor: res.data.conversationMessages.pageInfo.hasNextPage ? res.data.conversationMessages.pageInfo.endCursor : '',
                messages: loadedMessages,
                loadingEarlier: false
              })
            } else {
              throw new Error('Unexpected data from API call')
            }
          } catch(e) {
            setConversationState(fromError(e))
          }
        },
        setMessages: (fn: (prevMessages: IMessage[]) => IMessage[]): void => {
          setMessagesState(prevState => {
            const newMessagesList = fn(prevState.messages.data ? prevState.messages.data : [])
            
            return {
              endCursor: prevState.endCursor,
              messages: fromData(newMessagesList)
            } as conversationMessagesState
          })
        },
        loadEarlier: async () => {
          if(conversationState.data) {
            if(messagesState.endCursor) {
              setMessagesState(prevValue => ({
                endCursor: prevValue.endCursor,
                messages: prevValue.messages,
                loadingEarlier: true
              }))
              try {
                const res = await getMessages({ variables: { resourceId: conversationState.data.resource?.id,
                  otherAccountId: conversationState.data.otherAccount.id, 
                  first: MESSAGES_PER_PAGE,
                  after: messagesState.endCursor }})
    
                const nextMessages = asIMessages(res.data.conversationMessages.edges)
      
                setMessagesState(prevValue => ({
                  endCursor: res.data.conversationMessages.pageInfo.hasNextPage ? res.data.conversationMessages.pageInfo.endCursor : '',
                  messages: fromData([...prevValue.messages.data!, ...nextMessages]),
                  loadingEarlier: false
                }))
              } catch(e) {
                setMessagesState(prevValue => ({
                  endCursor: prevValue.endCursor,
                  messages: { ...fromError(e), ...{loading: false, data: prevValue.messages.data}},
                  loadingEarlier: false
                }))
              }
            }
          }
        }
    }

    return <ConversationContext.Provider value={{ conversationState: conversationState, messagesState: messagesState, actions}}>
        {children}
    </ConversationContext.Provider>
}

export default ConversationContextProvider