export interface Account {
    name: string,
    id: number,
    email: string,
    balance: number,
    hash?: string,
    resources?: Resource[],
    linkedAccounts: Account[],
    invitedAccounts: Account[],
    invitedByAccounts: Account[],
    recoveryCode: string,
    expirationRecoveryCode: Date
}

export interface Image {
    path: string,
    size: number,
    title: string,
    mimetype: string
}

export interface Resource {
    id: number,
    images: Image[],
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
    canBeExchanged: boolean
}

export interface Category {
    id: number,
    name: string
}

export interface AccountLinkRequest {
    id: number,
    requester: Account,
    target: Account
}

export interface ConversationData {
    withUser: Account,
    conversation: {
        id: number,
        lastMessageExcerpt: string | undefined,
        code: string,
        resource: Resource
        hasUnread: boolean
    }
}

export interface Message {
    text: string
    id: number
    created: Date
    from: Account
    image?: Image
    conversationId: number
    received?: Date
}

export const fromRawAccount = (raw: any): Account => {
    return {
        id: raw.Id, name: raw.nom, balance: raw.balance, email: raw.email, hash: raw.hash,
        resources: raw.ressources ? raw.ressources.map((rawRes:any) => fromRawResource(rawRes)): [],
        linkedAccounts: raw.comptes_liés ? raw.comptes_liés.map((rawAccount: any) => fromRawAccount(rawAccount)) : [],
        invitedAccounts: raw.comptes_invites ? raw.comptes_invites.map((rawAccount: any) => fromRawAccount(rawAccount)) : [],
        invitedByAccounts: raw['comptes List1'] ? raw['comptes List1'].map((rawAccount: any) => fromRawAccount(rawAccount)) : [],
        recoveryCode: raw.code_restauration,
        expirationRecoveryCode: raw.expiration_code_restauration
    }
}

export const fromRawResource = (raw: any): Resource => ({
    id: raw.Id,
    title: raw.titre,
    description: raw.description,
    expiration: raw.expiration,
    images: typeof raw.images === 'string' ? JSON.parse(raw.images) : raw.images,
    account: raw.comptes ? fromRawAccount(raw.comptes): undefined,
    categories: raw.categories ? resourceCategoriesFromRaw(raw.categories): [],
    isProduct: raw.produit,
    isService: raw.service,
    canBeDelivered: raw.livraison,
    canBeTakenAway: raw.aEmporter,
    canBeGifted: raw.donOk,
    canBeExchanged: raw.trocOk,
})

export const fromRawMessage = (raw: any): Message => ({
    id: raw.Id, created: raw.CreatedAt, from: fromRawAccount(raw.participant[0].compte[0]), 
    text: raw.texte, image: raw.image, conversationId: raw.conversations.Id
})

export const resourceCategoriesFromRaw = (raws: any[]): Category[] => {
    return raws.map((raw: any) => ({
        id: raw.Id as number,
        name: raw.nom as string
    }))
}

export const categoriesToRaw = (categories: Category[]): any[] => categories.map((category: Category) => ({
    Id: category.id,
    nom: category.name
}))

export const linkRequestFromRaw = (rawLinkRequest: any): AccountLinkRequest => ({
    id: rawLinkRequest.Id,
    requester: fromRawAccount(rawLinkRequest.demandeur[0]),
    target: fromRawAccount(rawLinkRequest.cible[0])
})