import { Socket, io } from "socket.io-client"
import { ensureChatSocketActive } from "./api"
import { baseUrl } from "./settings"
import { NewMessageData } from "./utils"
import { ConversationData } from "./schema"

interface Unread {
    conversationId: number
    unreads: number
}

export class ChatSocket {
    socket?: Socket = undefined
    token: string
    chatListeners: ((data: NewMessageData) => void)[] = []
    numberOfUnreadsChanged: (newNumber: number) => void
    conversationsStatusUpdated?: (status: Unread[]) => void
    newConversation?: (convData: ConversationData) => void

    constructor(token: string, numberOfUnreadsChanged: (newNumber: number) => void) {
        this.token = token
        this.numberOfUnreadsChanged = numberOfUnreadsChanged
    }

    setConversationsStatusUpdatedFn (fn: (status: Unread[]) => void) {
        this.conversationsStatusUpdated = fn
    }

    setNewConversationFn (fn: (convData: ConversationData) => void) {
        this.newConversation = fn
    }

    async init () {
        await ensureChatSocketActive() 
        this.socket = io(baseUrl, { path : '/api/chatio/io', addTrailingSlash: false, auth: { token: this.token } })
        this.socket.on('unread_changed', ((data: Unread[]) => {
            this.numberOfUnreadsChanged(data.reduce<number>((prev, current) => current.unreads + prev, 0))
            if(this.conversationsStatusUpdated) this.conversationsStatusUpdated(data)
        }))
        this.socket.on('new_conversation', (convData: ConversationData) => {
            if(this.newConversation) this.newConversation(convData)
        })
    }

    setLastReadMessage(token: string, messageId: number) {
        if(this.socket) {
            this.socket.emit('read_message', token, messageId)
        }
    }

    pushStackChatMessageListener(listener: (data: NewMessageData) => void) {
        this.chatListeners.push(listener)
        this.socket!.off('chat_message')
        this.socket!.on('chat_message', listener)
    }

    popStackChatMessageListener() {
        this.chatListeners.pop()
        this.socket!.off('chat_message')
        if(this.chatListeners.length > 0) this.socket!.on('chat_message', this.chatListeners[this.chatListeners.length - 1])
    }
}
