import DataLoadState, { fromData, initial } from "@/lib/DataLoadState"
import { urlFromPublicId } from "@/lib/images"
import { gql, useLazyQuery } from "@apollo/client"
import { createContext, useState } from "react"
import React from "react"
import { Category, Resource, fromServerGraphResource } from "@/lib/schema"
import { IMessage } from "react-native-gifted-chat"

const asIMessages = (messages: any[]): IMessage[] => messages.map(msg => asIMessage(msg))

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

export const CONVERSATION_MESSAGES = gql`query ConversationMessages($resourceId: Int!, $otherAccountId: Int!) {
    conversationMessages(resourceId: $resourceId, otherAccountId: $otherAccountId) {
      nodes {
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
    conversation: DataLoadState<{ messages: IMessage[], resource?: Resource, otherAccount: { id: number, name: string } } | undefined>
}

interface ConversationActions {
    load: (resourceId: number, otherAccountId: number, categories: Category[]) => Promise<void>
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
    otherAccount: { id: 0, name: '' }
  })
}

export const ConversationContext = createContext<ConversationContext>({
    state: blankState,
    actions: {
        load: async() => {},
        setMessages: () => []
    }
})

const ConversationContextProvider = ({ children }: Props) => {
    const [getMessages] = useLazyQuery(CONVERSATION_MESSAGES)
    const [conversationState, setConversationState] = useState(blankState)
    
    const actions: ConversationActions = {
        load: async (resourceId: number, otherAccountId: number, categories: Category[]) => {
          const res = await getMessages({ variables: { resourceId: new Number(resourceId), otherAccountId: new Number(otherAccountId) }})

          if(res.data) {
            const loadedMessages = asIMessages(res.data.conversationMessages.nodes)

            setConversationState(prevValue => ({ ...prevValue, ...{ 
              conversation: fromData({ 
                messages: loadedMessages,
                otherAccount: { id: res.data.accountById.id, name: res.data.accountById.name },
                resource: fromServerGraphResource(res.data.resourceById, categories)
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
        } 
    }

    return <ConversationContext.Provider value={{ state: conversationState, actions}}>
        {children}
    </ConversationContext.Provider>
}

export default ConversationContextProvider