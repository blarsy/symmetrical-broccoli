import { createContext, Dispatch, useReducer } from "react"
import { ConversationData, NewMessage } from "../chat/lib"
import { Resource } from "@/lib/schema"

export interface ChatStateData {
  unreadConversations: number[]
  currentConversationId?: number
  newChatMessage?: NewMessage
  conversations: ConversationData[]
  chatMessageCustomHandler?: (msg: any) => void
  newConversationState?: {
    resource: Resource
  }
}

const blankChatContext = { 
    unreadConversations: [],
    currentConversationId: undefined,
    conversations: []
} as ChatStateData

export enum ChatReducerActionType {
  SetConversationRead,
  SetCurrentConversationId,
  SetNewChatMessage,
  SetChatMessageCustomHandler,
  SetConversations,
  SetNewConversation
}

const chatReducer = (previousState: ChatStateData, action: { type: ChatReducerActionType, payload: any }): ChatStateData => {
  let newState : any
  switch(action.type) {
    case ChatReducerActionType.SetConversationRead:
        newState = { unreadConversations: previousState.unreadConversations.filter(c => c !== action.payload) }
        break
    case ChatReducerActionType.SetCurrentConversationId:
        newState = { currentConversationId: action.payload }
        break
    case ChatReducerActionType.SetNewChatMessage:
        const message = action.payload as NewMessage
        const messageConversationId = message.conversationId
        if(messageConversationId != previousState.currentConversationId && !previousState.unreadConversations.find(c => c === messageConversationId)) {
            newState = { newChatMessage: message, unreadConversations: [ ...previousState.unreadConversations, messageConversationId] }
        }

        let targetConversation = previousState.conversations.find(conv => conv.id === messageConversationId)
        if(!targetConversation) {
            // if first message in a conversation, the conversation needs to be created
            targetConversation = {
                id: messageConversationId,
                accountName: message.senderName,
                numberOfUnreadMessages: 1,
                resourceId: message.resourceId,
                resourceName: message.resourceName,
                imagePublicId: message.image,
                lastMessage: message.text || '<Image>',
                lastMessageDate: message.created,
                resourceImagePublicId: message.resourceImage
            }
        } else {
            // if conversation exists, change its lastMessage value, and increment numberOfUnreads
            targetConversation.numberOfUnreadMessages ++
            targetConversation.lastMessage = message.text || '<Image>'
            targetConversation.lastMessageDate = message.created
        }
        const newConversationsList = [targetConversation, ...previousState.conversations.filter(conv => conv.id != messageConversationId)]
        newState = { ...newState, ...{conversations: newConversationsList } } 
        break
    case ChatReducerActionType.SetChatMessageCustomHandler:
        newState = { chatMessageCustomHandler: action.payload }
        break
    case ChatReducerActionType.SetConversations:
        newState = { conversations: action.payload }
        break
    case ChatReducerActionType.SetNewConversation:
        newState = { newConversationState: { resource: action.payload } }
        break
    default:
        throw new Error(`Unexpected reducer action type ${action.type}`)
  }
  //console.log('action.type', action.type,'newState', newState, 'prev', previousState, 'new', {...previousState, ...newState})
  return {...previousState, ...newState}
}

export const ChatContext = createContext<ChatStateData>(blankChatContext)
export const ChatDispatchContext = createContext((() => {}) as Dispatch<{ type: ChatReducerActionType, payload: any }>)

interface Props {
    children: JSX.Element
    initial?: ChatStateData
}
const ChatContextProvider = ({ children, initial }: Props) => {
    const [chatState, dispatch] = useReducer<(previousState: ChatStateData, action: { type: ChatReducerActionType, payload: any }) => ChatStateData>(chatReducer, initial || blankChatContext)

    return <ChatContext.Provider value={chatState}>
        <ChatDispatchContext.Provider value={dispatch}>
            {children}
        </ChatDispatchContext.Provider>
    </ChatContext.Provider>
}

export default ChatContextProvider