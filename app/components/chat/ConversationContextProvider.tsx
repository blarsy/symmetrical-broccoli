import DataLoadState, { fromError, fromData, initial } from "@/lib/DataLoadState"
import { gql, useLazyQuery } from "@apollo/client"
import { createContext, ReactNode, useState } from "react"
import React from "react"
import { Category, Resource, fromServerGraphResource } from "@/lib/schema"
import { IMessage } from "./Chat"

export const MESSAGES_PER_PAGE = 25
const asIMessages = (messages: any[]): IMessage[] => messages.map(msg => asIMessage(msg.node))

export const asIMessage = (msg: any): IMessage => {
  return {
    id: msg.id,
    text: msg.text,
    createdAt: msg.created,
    user: {
        id: msg.participantByParticipantId.accountsPublicDatumByAccountId.id,
        name: msg.participantByParticipantId.accountsPublicDatumByAccountId.name,
        avatar: msg.participantByParticipantId.accountsPublicDatumByAccountId.imageByAvatarImageId?.publicId
    },
    image: msg.imageByImageId?.publicId,
    received: !!msg.received,
    sent: true,
  }
}

export const CONVERSATION_MESSAGES = gql`query ConversationMessages($resourceId: UUID!, $otherAccountId: UUID!, $after: Cursor, $first: Int!) {
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
          accountsPublicDatumByAccountId {
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
  accountsPublicDatumById(id: $otherAccountId) {
    id
    name
    imageByAvatarImageId {
      publicId
    }
  }
  resourceById(id: $resourceId) {
    accountsPublicDatumByAccountId {
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
    campaignsResourcesByResourceId {
      nodes {
        campaignId
      }
    }
  }
}`

interface ConversationData {
  id: string,
  participantId: string,
  resource?: Resource, 
  otherAccount: { id: string, name: string, avatarPublicId: string }
}

export interface ConversationState extends DataLoadState<ConversationData | undefined> {}

export interface conversationMessagesState {
    endCursor: string
    messages: DataLoadState<IMessage[]>
    loadingEarlier: boolean
}

interface ConversationActions {
    load: (resourceId: string, otherAccountId: string, categories: Category[]) => Promise<void>
    loadEarlier: () => Promise<void>
    setMessages: (fn: (prevMessages: IMessage[]) => IMessage[]) => void
}
interface ConversationContext {
    conversationState: ConversationState
    messagesState: conversationMessagesState
    actions: ConversationActions
}
interface Props {
    children: ReactNode
}

const blankConversationState: ConversationState = initial(true, {
  id: '',
  participantId: '',
  resource: undefined, 
  otherAccount: { id: '', name: '', avatarPublicId: '' }
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
        load: async (resourceId: string, otherAccountId: string, categories: Category[]) => {
          try {
            const res = await getMessages({ variables: { resourceId: resourceId, otherAccountId: otherAccountId, first: MESSAGES_PER_PAGE }})
            if(res.data) {
              const loadedMessages = fromData(asIMessages(res.data.conversationMessages.edges))

              setConversationState(fromData<ConversationData>({ 
                  id: res.data.conversationMessages.edges.length > 0 ? 
                    res.data.conversationMessages.edges[0].node.participantByParticipantId.conversationByConversationId.id :
                    '',
                  participantId: res.data.conversationMessages.edges.length > 0 ? 
                    res.data.conversationMessages.edges[0].node.participantByParticipantId.id :
                    '',
                  otherAccount: { 
                    id: res.data.accountsPublicDatumById.id, 
                    name: res.data.accountsPublicDatumById.name, 
                    avatarPublicId: res.data.accountsPublicDatumById.imageByAvatarImageId?.publicId
                  },
                  resource: fromServerGraphResource(res.data.resourceById, categories)
                })
              )
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