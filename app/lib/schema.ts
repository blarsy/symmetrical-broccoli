import { urlFromPublicId } from "./images"

export interface Account {
    name: string,
    id: number,
    email: string,
    hash?: string,
    avatarImageUrl?: string
}

export enum LinkTypes {
    facebook = 1,
    instagram = 2,
    twitter = 3,
    web = 4
}

export interface Link {
    id: number
    url: string
    label: string
    type: LinkTypes
}

export interface AccountInfo {
    name: string
    id: number
    email: string
    avatarPublicId: string
    activated: Date
}

export interface ImageInfo {
    path?: string
    publicId?: string
}

export interface Category {
    code: string,
    name: string
}

export interface Message {
    text: string
    id: number
    created: Date
    from: Account
    image?: ImageInfo
    conversationId?: number
    received?: Date
}

export interface Resource {
    id: number,
    images: ImageInfo[],
    title: string,
    description: string,
    expiration?: Date,
    account?: Account,
    categories: Category[],
    isService: boolean,
    isProduct: boolean,
    canBeTakenAway: boolean,
    canBeDelivered: boolean,
    canBeGifted: boolean,
    canBeExchanged: boolean,
    created: Date,
    deleted: Date | null
}

export interface ConversationData {
    withUser: Account
    conversation: {
        id: number
        lastMessageExcerpt: string | undefined
        lastMessageTime: Date | undefined
        resource: Resource
        hasUnread: boolean
    }
}

export const fromServerGraphResource = (rawRes: any, categories: Category[]):Resource => {
    const resourceCategories: Category[] = rawRes.resourcesResourceCategoriesByResourceId && rawRes.resourcesResourceCategoriesByResourceId.nodes ?
        rawRes.resourcesResourceCategoriesByResourceId.nodes.map((cat: any) => categories.find(fullCat => fullCat.code == cat.resourceCategoryCode)) :
        []
    const images = rawRes.resourcesImagesByResourceId && rawRes.resourcesImagesByResourceId.nodes ?
        rawRes.resourcesImagesByResourceId.nodes.map((imgData: any) => ({ publicId: imgData.imageByImageId.publicId} as ImageInfo)) :
        []

    return {
        id: rawRes.id, title: rawRes.title, description: rawRes.description, expiration: rawRes.expiration, created: rawRes.created,
        isProduct: rawRes.isProduct, isService: rawRes.isService, canBeDelivered: rawRes.canBeDelivered, canBeExchanged: rawRes.canBeExchanged,
        canBeGifted: rawRes.canBeGifted, canBeTakenAway: rawRes.canBeTakenAway,
        categories: resourceCategories, 
        account: rawRes.accountByAccountId,
        deleted: rawRes.deleted,
        images
} as Resource
}

export const fromServerGraphResources = (data: any[], categories: Category[]): Resource[] => {
    return data.map((rawRes: any) => fromServerGraphResource(rawRes, categories))
}

export const fromServerGraphConversations = (data: any[], loggedInAccountId: number): ConversationData[] => {
    return data.map((rawConversation: any) => {
        const meAsParticipant = rawConversation.participantsByConversationId.nodes.find((participant: any) => participant.accountByAccountId.id === loggedInAccountId)
        const otherParticipant = rawConversation.participantsByConversationId.nodes.find((participant: any) => participant.accountByAccountId.id != loggedInAccountId)

        return ({
            conversation: {
                hasUnread: meAsParticipant.unreadMessagesByParticipantId.totalCount > 0,
                id: rawConversation.id,
                lastMessageExcerpt: rawConversation.messageByLastMessage.text,
                lastMessageTime: rawConversation.messageByLastMessage.created,
                resource: {
                    title: rawConversation.resourceByResourceId.title,
                    id: rawConversation.resourceByResourceId.id,
                    canBeGifted: rawConversation.resourceByResourceId.canBeGifted,
                    canBeExchanged: rawConversation.resourceByResourceId.canBeExchanged,
                    images: rawConversation.resourceByResourceId.resourcesImagesByResourceId.nodes.map((img: any) => ({
                        publicId: img.imageByImageId.publicId
                    })),
                    account: {
                        id: rawConversation.resourceByResourceId.accountByAccountId.id,
                        name: rawConversation.resourceByResourceId.accountByAccountId.name,
                        email: rawConversation.resourceByResourceId.accountByAccountId.email,
                        avatarImageUrl: rawConversation.resourceByResourceId.accountByAccountId.imageByAvatarImageId ? urlFromPublicId(rawConversation.resourceByResourceId.accountByAccountId.imageByAvatarImageId.publicId) : undefined
                    },
                    //Following values are not used, so just give them some default values
                    canBeDelivered: false,
                    canBeTakenAway: false,
                    description: '',
                    isProduct: false,
                    isService: false,
                    categories: [],
                    created: new Date(),
                    deleted: null
                }
            },
            withUser: {
                id: otherParticipant.accountByAccountId.id,
                email: otherParticipant.accountByAccountId.email,
                name: otherParticipant.accountByAccountId.name,
                avatarImageUrl: otherParticipant.accountByAccountId.imageByAvatarImageId ? urlFromPublicId(otherParticipant.accountByAccountId.imageByAvatarImageId.publicId) : undefined
            }
        })
    }).sort((a, b) => {
        if(a.conversation.lastMessageTime < b.conversation.lastMessageTime) return 1
        return -1
    })
}

export const getIconForLink = (type: LinkTypes) => {
    switch(type) {
        case LinkTypes.facebook:
            return 'facebook'
        case LinkTypes.instagram:
            return 'instagram'
        case LinkTypes.twitter:
            return 'twitter'
        default:
            return 'web'
    }
}