import DataLoadState from "@/lib/DataLoadState"
import { Resource } from "@/lib/schema"

export interface ResourceHeaderData {
    id: string
    participantId: string
    resource?: Resource
    otherAccount: ConversationOtherAccountData
}

export interface ConversationOtherAccountData  { 
    id: string
    participantId: string
    name: string
    imagePublicId?: string
    avatarImageUrl?: string
}

export interface ConversationState extends DataLoadState<{
    conversation: ResourceHeaderData
    messages: Message[]
} | undefined> {}

export interface Message {
    id: string
    text: string
    createdAt: Date
    user: {
        id: string
        name: string
        avatar: string
    }
    image?: string
    sent?: boolean
    received?: boolean
}

export interface ConversationData {
    id: string
    accountName: string
    imagePublicId?: string
    resourceId: string
    resourceName: string
    resourceImagePublicId?: string
    numberOfUnreadMessages: number
    lastMessage?: string
    lastMessageDate?: Date
}

export interface NewMessage {
    conversationId: string
    senderId: string
    senderName: string
    senderAvatarPublicId: string
    senderImage?: string
    resourceId: string
    resourceName: string
    resourceImage?: string
    text: string
    image?: string
    created: Date
}