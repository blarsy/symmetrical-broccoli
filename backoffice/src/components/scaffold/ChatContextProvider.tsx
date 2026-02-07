import { createContext, Dispatch, JSX, useReducer } from "react"
import { ConversationData, NewMessage } from "../chat/lib"
import { Account, Resource } from "@/lib/schema"

export interface ChatStateData {
  unreadConversations: string[]
  currentConversationId?: string
  newChatMessage?: NewMessage
  conversations: ConversationData[]
  chatMessageCustomHandler?: (msg: any) => void
  newConversationState?: {
    resource: Resource
    withAccount?: Account
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
  SetConversationCreated,
  SetNewChatMessage,
  DismissNewMessage,
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
    case ChatReducerActionType.SetConversationCreated:
            let newConversationList: ConversationData[] = []
            if(previousState.newConversationState) {
                const newConversationData = previousState.conversations.find(c => c.resourceId && c.resourceId === previousState.newConversationState?.resource.id)!
                newConversationData.id = action.payload
                newConversationList.push(newConversationData)
            }
            newState = {
                currentConversationId: action.payload, 
                newConversationState: undefined, 
                conversations: [...newConversationList, ...previousState.conversations.filter(c => !c.resourceId || c.resourceId != previousState.newConversationState?.resource.id)]
            }
        break
    case ChatReducerActionType.SetCurrentConversationId:
        if(action.payload) {
            newState = {
                currentConversationId: action.payload, 
                newConversationState: undefined, 
                conversations: previousState.conversations.filter(c => !c.resourceId || c.resourceId != previousState.newConversationState?.resource.id)
            }
        } else {
            newState = { currentConversationId: undefined }
        }
        break
    case ChatReducerActionType.SetNewChatMessage:
        const message = action.payload as NewMessage
        const messageConversationId = message.conversationId
        newState = {}
        if(messageConversationId != previousState.currentConversationId && !previousState.unreadConversations.find(c => c === messageConversationId)) {
            newState.unreadConversations = [ ...previousState.unreadConversations, messageConversationId]
        }
        newState.newChatMessage = message 

        let targetConversation = previousState.conversations.find(conv => conv.id === messageConversationId)
        if(!targetConversation) {
            // if first message in a conversation, the conversation needs to be created
            targetConversation = {
                id: messageConversationId,
                accountName: message.senderName,
                numberOfUnreadMessages: 1,
                resourceId: message.resourceId,
                resourceName: message.resourceName,
                imagePublicId: message.senderAvatarPublicId,
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
        newState.conversations = newConversationsList
        //console.log('new message state', newState)
        break
    case ChatReducerActionType.DismissNewMessage:
        newState = { ...newState, ...{ newChatMessage: undefined }  }
        break
    case ChatReducerActionType.SetChatMessageCustomHandler:
        newState = { chatMessageCustomHandler: action.payload }
        break
    case ChatReducerActionType.SetConversations:
        newState = { conversations: action.payload }
        break
    case ChatReducerActionType.SetNewConversation:
        if(!action.payload) {
            newState = { newConversationState: undefined, conversations: previousState.conversations.filter(c => !c.resourceId || c.resourceId != previousState.newConversationState?.resource.id) }
        } else {
            newState = { newConversationState: action.payload }
        }
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
    const [chatState, dispatch] = useReducer(chatReducer, initial || blankChatContext)

    return <ChatContext.Provider value={chatState}>
        <ChatDispatchContext.Provider value={dispatch}>
            {children}
        </ChatDispatchContext.Provider>
    </ChatContext.Provider>
}

export default ChatContextProvider