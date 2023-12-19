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

export interface Category {
    id: number,
    name: string
}

export interface Message {
    text: string
    id: number
    created: Date
    from: Account
    image?: Image
    conversationId?: number
    received?: Date
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
    canBeExchanged: boolean,
    created: Date
}

export interface ConversationData {
    withUser: Account
    conversation: {
        id: number
        lastMessageExcerpt: string | undefined
        code: string
        resource: Resource
        hasUnread: boolean
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