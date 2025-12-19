import { urlFromPublicId } from "./images"

export interface Location {
    latitude: number
    longitude: number
    address: string
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

export const parseLocationFromGraph = (raw: any): Location | null => {
    if(!raw) return null

    return ({
        address: raw.address,
        latitude: parseFloat(raw.latitude),
        longitude: parseFloat(raw.longitude)
    })
}

export interface Account {
    name: string,
    id: number,
    email: string,
    avatarImagePublicId?: string
}

export interface ImageInfo {
    path?: string
    publicId?: string
}

export interface Category {
    code: number,
    name: string
}

export interface Resource {
    id: number
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
    campaignId?: number
}

export const fromServerGraphAccount = (rawAccount: any): Account => ({ 
    name: rawAccount.name,
    id: rawAccount.id,
    email: rawAccount.email,
    avatarImagePublicId: rawAccount.imageByAvatarImageId ? rawAccount.imageByAvatarImageId.publicId : ''
})

export const fromServerGraphResource = (rawRes: any, categories: Category[]):Resource => {
    const resourceCategories: Category[] = rawRes.resourcesResourceCategoriesByResourceId && rawRes.resourcesResourceCategoriesByResourceId.nodes ?
        rawRes.resourcesResourceCategoriesByResourceId.nodes.map((cat: any) => categories.find(fullCat => fullCat.code == cat.resourceCategoryCode)) :
        []
    const images = rawRes.resourcesImagesByResourceId && rawRes.resourcesImagesByResourceId.nodes ?
        rawRes.resourcesImagesByResourceId.nodes.map((imgData: any) => ({ publicId: imgData.imageByImageId.publicId} as ImageInfo)) :
        []
    return {
        id: rawRes.id, title: rawRes.title, description: rawRes.description, 
        expiration: rawRes.expiration && new Date(rawRes.expiration), created: rawRes.created && new Date(rawRes.created),
        isProduct: rawRes.isProduct, isService: rawRes.isService, canBeDelivered: rawRes.canBeDelivered, canBeExchanged: rawRes.canBeExchanged,
        canBeGifted: rawRes.canBeGifted, canBeTakenAway: rawRes.canBeTakenAway,
        categories: resourceCategories, 
        account: fromServerGraphAccount(rawRes.accountByAccountId),
        deleted: rawRes.deleted && new Date(rawRes.deleted),
        specificLocation: parseLocationFromGraph(rawRes.locationBySpecificLocationId),
        images, price: rawRes.price,
        campaignId: (rawRes.campaignsResourcesByResourceId && rawRes.campaignsResourcesByResourceId.nodes.length > 0 && rawRes.campaignsResourcesByResourceId.nodes[0].campaignId) || undefined
} as Resource
}

export interface Bid {
    id: number
    amountOfTokens: number
    resource: Resource
    account: Account
    created: Date
    refused?: Date
    deleted?: Date
    accepted?: Date
    validUntil: Date
}