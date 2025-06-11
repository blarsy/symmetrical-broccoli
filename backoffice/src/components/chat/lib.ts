import DataLoadState from "@/lib/DataLoadState"
import { Resource } from "@/lib/schema"

export interface ConversationDisplayData {
    id: number
    participantId: number
    resource?: Resource
    otherAccount: { id: number, name: string, willingToContribute: boolean, imagePublicId: string } 
}

export interface ConversationState extends DataLoadState<{
    conversation: ConversationDisplayData
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