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
    avatarImageUrl?: string
    willingToContribute?: boolean
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
    suspended?: Date,
    paidUntil?: Date,
    created: Date,
    deleted: Date | null,
    specificLocation: Location | null,
    subjectiveValue: number | null
}

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
        account: { 
            name: rawRes.accountByAccountId.name,
            id: rawRes.accountByAccountId.id,
            email: rawRes.accountByAccountId.email,
            avatarImageUrl: rawRes.accountByAccountId.imageByAvatarImageId && urlFromPublicId(rawRes.accountByAccountId.imageByAvatarImageId.publicId),
            willingToContribute: rawRes.accountByAccountId.willingToContribute
        },
        deleted: rawRes.deleted && new Date(rawRes.deleted),
        suspended:  rawRes.suspended && new Date(rawRes.suspended),
        paidUntil: rawRes.paidUntil && new Date(rawRes.paidUntil),
        specificLocation: parseLocationFromGraph(rawRes.locationBySpecificLocationId),
        images, subjectiveValue: rawRes.subjectiveValue
} as Resource
}