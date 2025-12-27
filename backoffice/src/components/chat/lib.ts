import DataLoadState from "@/lib/DataLoadState"
import { Resource } from "@/lib/schema"

export interface ResourceHeaderData {
    id: number
    participantId: number
    resource?: Resource
    otherAccount: ConversationOtherAccountData
}

export interface ConversationOtherAccountData  { 
    id: number
    participantId: number
    name: string
    imagePublicId?: string
    avatarImageUrl?: string
}

export interface ConversationState extends DataLoadState<{
    conversation: ResourceHeaderData
    messages: Message[]
} | undefined> {}

export interface Message {
    id: number
    text: string
    createdAt: Date
    user: {
        id: number
        name: string
        avatar: string
    }
    image?: string
    sent?: boolean
    received?: boolean
}

export interface ConversationData {
    id: number
    accountName: string
    imagePublicId?: string
    resourceId: number
    resourceName: string
    resourceImagePublicId?: string
    numberOfUnreadMessages: number
    lastMessage?: string
    lastMessageDate?: Date
}

export interface NewMessage {
    conversationId: number
    senderName: string
    senderImage?: string
    resourceId: number
    resourceName: string
    resourceImage?: string
    text: string
    image?: string
    created: Date
}