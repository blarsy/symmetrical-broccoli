export interface Account {
    name: string,
    id: number,
    email: string,
    balance: number,
    hash?: string,
    resources?: Resource[],
    linkedAccounts: Account[],
    invitedAccounts: Account[],
    invitedByAccounts: Account[]
}

export interface Image {
    path: string,
    size: number,
    title: string,
    mimetype: string
}

export interface Condition {
    title: string,
    description: string,
    id?: number
}

export interface Category {
    id: number,
    name: string
}

export interface Message {
    text: string,
    id: number,
    created: Date,
    from: Account,
    image?: Image
}

export interface Resource {
    id: number,
    images: Image[],
    conditions: Condition[],
    title: string,
    description: string,
    expiration?: Date,
    account?: Account,
    categories: Category[]
}

export interface ConversationData {
    withUser: Account,
    conversation: {
        id: number,
        lastMessageExcerpt: string | undefined,
        ressourceTitle: string,
    }
}

export interface AccountLinkRequest {
    id: number,
    requester: Account,
    target: Account
}

export interface Network {
    linkRequests: Account[], 
    linkedAccounts: Account[], 
    receivedLinkRequests: Account[]
}

export const fromRawAccount = (raw: any): Account => ({
    id: raw.Id, name: raw.nom, balance: raw.balance, email: raw.email, hash: raw.hash,
    resources: raw.ressources ? raw.ressources.map((rawRes:any) => fromRawResource(rawRes)): [],
    linkedAccounts: raw.comptes_liés ? raw.comptes_liés.map((rawAccount: any) => fromRawAccount(rawAccount)) : [],
    invitedAccounts: raw.comptes_invites ? raw.comptes_invites.map((rawAccount: any) => fromRawAccount(rawAccount)) : [],
    invitedByAccounts: raw['comptes List1'] ? raw['comptes List1'].map((rawAccount: any) => fromRawAccount(rawAccount)) : []
})

export const fromRawResource = (raw: any): Resource => ({
    id: raw.Id,
    title: raw.titre,
    description: raw.description,
    expiration: raw.expiration,
    images: raw.images,
    conditions: raw.conditions ? conditionsFromRaw(raw.conditions): [],
    account: raw.comptes ? fromRawAccount(raw.comptes): undefined,
    categories: raw.categories ? resourceCategoriesFromRaw(raw.categories): []
})

export const conditionsFromRaw = (raws: any[]): Condition[] => {
    return raws.map((raw: any) => ({
        id: raw.Id as number,
        title: raw.titre as string,
        description: raw.description as string
    }))
}

export const resourceCategoriesFromRaw = (raws: any[]): Category[] => {
    return raws.map((raw: any) => ({
        id: raw.Id as number,
        name: raw.nom as string
    }))
}

export const conditionsToRaw = (conditions: Condition[]): any[] => {
    return conditions.map((condition: any) => ({
        Id: condition.id,
        titre: condition.title,
        description: condition.description
    }))
}

export const linkRequestFromRaw = (rawLinkRequest: any): AccountLinkRequest => ({
    id: rawLinkRequest.Id,
    requester: fromRawAccount(rawLinkRequest.demandeur[0]),
    target: fromRawAccount(rawLinkRequest.cible[0])
})