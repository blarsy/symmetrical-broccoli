import { urlFromPublicId } from "./images"

export interface Account {
    name: string,
    id: string,
    avatarImageUrl?: string
}

export enum LinkTypes {
    facebook = 1,
    instagram = 2,
    twitter = 3,
    web = 4
}

export interface Link {
    id: string
    url: string
    label: string
    type: LinkTypes
}

export interface Location {
    latitude: number
    longitude: number
    address: string
}

export interface AccountInfo {
    name: string
    id: string
    email: string
    avatarPublicId: string
    activated: Date
    unreadConversations: string[]
    unreadNotifications: string[]
    amountOfTokens: number
    lastChangeTimestamp: Date
    numberOfExternalAuthProviders: number
    knowsAboutCampaigns: boolean
}

export interface ImageInfo {
    path?: string
    publicId?: string
}

export interface Category {
    code: number,
    name: string
}

export interface Message {
    text: string
    id: string
    created: Date
    from: Account
    image?: ImageInfo
    conversationId?: string
    received?: Date
}

export interface Resource {
    id: string
    images: ImageInfo[]
    title: string
    description: string
    expiration?: Date
    account?: Account
    categories: Category[]
    isService: boolean
    isProduct: boolean
    canBeTakenAway: boolean
    canBeDelivered: boolean
    canBeGifted: boolean
    canBeExchanged: boolean
    created: Date
    deleted: Date | null
    specificLocation: Location | null
    price: number | null
    inActiveCampaign: boolean
}

export interface ConversationData {
    withUser: Account
    conversation: {
        id: string
        participantId: string
        lastMessageExcerpt: string | undefined
        lastMessageTime: Date | undefined
        resource: Resource
        hasUnread: boolean
    }
}

export const parseLocationFromGraph = (raw: any): Location | null => {
    if(!raw) return null

    return ({
        address: raw.address,
        latitude: parseFloat(raw.latitude),
        longitude: parseFloat(raw.longitude)
    })
}

export const fromServerGraphResource = (rawRes: any, categories: Category[], activeCampaignId?: string):Resource => {
    const resourceCategories: Category[] = rawRes.resourcesResourceCategoriesByResourceId && rawRes.resourcesResourceCategoriesByResourceId.nodes ?
        rawRes.resourcesResourceCategoriesByResourceId.nodes.map((cat: any) => categories.find(fullCat => fullCat.code == cat.resourceCategoryCode)) :
        []
    const images = rawRes.resourcesImagesByResourceId && rawRes.resourcesImagesByResourceId.nodes ?
        rawRes.resourcesImagesByResourceId.nodes.map((imgData: any) => ({ publicId: imgData.imageByImageId.publicId} as ImageInfo)) :
        []
    let inActiveCampaign = false
    if(activeCampaignId && rawRes.campaignsResourcesByResourceId && rawRes.campaignsResourcesByResourceId.nodes.length > 0) {
        inActiveCampaign = !!rawRes.campaignsResourcesByResourceId.nodes.find((cr: any) => cr.campaignId === activeCampaignId)
    }
    return {
        id: rawRes.id, title: rawRes.title, description: rawRes.description, 
        expiration: rawRes.expiration && new Date(rawRes.expiration), created: rawRes.created && new Date(rawRes.created),
        isProduct: rawRes.isProduct, isService: rawRes.isService, canBeDelivered: rawRes.canBeDelivered, canBeExchanged: rawRes.canBeExchanged,
        canBeGifted: rawRes.canBeGifted, canBeTakenAway: rawRes.canBeTakenAway,
        categories: resourceCategories, 
        account: { 
            name: rawRes.accountsPublicDatumByAccountId.name,
            id: rawRes.accountsPublicDatumByAccountId.id,
            avatarImageUrl: rawRes.accountsPublicDatumByAccountId.imageByAvatarImageId && urlFromPublicId(rawRes.accountsPublicDatumByAccountId.imageByAvatarImageId.publicId)
        },
        deleted: rawRes.deleted && new Date(rawRes.deleted),
        specificLocation: parseLocationFromGraph(rawRes.locationBySpecificLocationId),
        images, price: rawRes.price,
        inActiveCampaign
} as Resource
}

export const fromServerGraphResources = (data: any[], categories: Category[], activeCampaignId?: string): Resource[] => {
    return data.map((rawRes: any) => fromServerGraphResource(rawRes, categories, activeCampaignId))
}

export const fromServerGraphConversations = (data: any[], loggedInAccountId: string): ConversationData[] => {
    return data.map((rawConversation: any) => {
        const meAsParticipant = rawConversation.participantsByConversationId.nodes.find((participant: any) => participant.accountsPublicDatumByAccountId.id === loggedInAccountId)
        const otherParticipant = rawConversation.participantsByConversationId.nodes.find((participant: any) => participant.accountsPublicDatumByAccountId.id != loggedInAccountId)

        return ({
            conversation: {
                hasUnread: meAsParticipant.unreadMessagesByParticipantId.totalCount > 0,
                id: rawConversation.id,
                lastMessageExcerpt: rawConversation.messageByLastMessageId.text,
                lastMessageTime: rawConversation.messageByLastMessageId.created,
                participantId: rawConversation.participantsByConversationId.nodes.find((part: any) => part.accountsPublicDatumByAccountId.id === loggedInAccountId).id,
                resource: {
                    title: rawConversation.resourceByResourceId.title,
                    id: rawConversation.resourceByResourceId.id,
                    canBeGifted: rawConversation.resourceByResourceId.canBeGifted,
                    canBeExchanged: rawConversation.resourceByResourceId.canBeExchanged,
                    images: rawConversation.resourceByResourceId.resourcesImagesByResourceId.nodes.map((img: any) => ({
                        publicId: img.imageByImageId.publicId
                    })),
                    price: rawConversation.resourceByResourceId.price,
                    account: {
                        id: rawConversation.resourceByResourceId.accountsPublicDatumByAccountId.id,
                        name: rawConversation.resourceByResourceId.accountsPublicDatumByAccountId.name,
                        email: rawConversation.resourceByResourceId.accountsPublicDatumByAccountId.email,
                        avatarImageUrl: rawConversation.resourceByResourceId.accountsPublicDatumByAccountId.imageByAvatarImageId ? urlFromPublicId(rawConversation.resourceByResourceId.accountsPublicDatumByAccountId.imageByAvatarImageId.publicId) : undefined
                    },
                    //Following values are not used, so just give them some default values
                    canBeDelivered: false,
                    canBeTakenAway: false,
                    description: '',
                    isProduct: false,
                    isService: false,
                    categories: [],
                    created: new Date(),
                    deleted: null,
                    specificLocation: null,
                    inActiveCampaign: false
                }
            },
            withUser: {
                id: otherParticipant.accountsPublicDatumByAccountId.id,
                email: otherParticipant.accountsPublicDatumByAccountId.email,
                name: otherParticipant.accountsPublicDatumByAccountId.name,
                avatarImageUrl: otherParticipant.accountsPublicDatumByAccountId.imageByAvatarImageId ? urlFromPublicId(otherParticipant.accountsPublicDatumByAccountId.imageByAvatarImageId.publicId) : undefined
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

export interface Bid {
    id: string
    amountOfTokens: number
    resource: Resource
    account: Account
    created: Date
    refused?: Date
    deleted?: Date
    accepted?: Date
    validUntil: Date
}

export const fromServerGraphAccount = (rawAccount: any): Account => ({ 
    name: rawAccount.name,
    id: rawAccount.id,
    avatarImageUrl: rawAccount.imageByAvatarImageId && urlFromPublicId(rawAccount.imageByAvatarImageId.publicId)
})

export const bidFromServerGraph = (bid: any, categories: Category[]): Bid => {
    return {
        id: bid.id, amountOfTokens: bid.amountOfTokens, created: bid.created, accepted: bid.accepted,
        refused: bid.refused, deleted: bid.deleted, resource: fromServerGraphResource(bid.resourceByResourceId, categories),
        account: fromServerGraphAccount(bid.accountsPublicDatumByAccountId), validUntil: bid.validUntil
    }
}