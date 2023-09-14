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

export interface Condition {
    title: string,
    description: string,
    id?: number
}

export interface Resource {
    id: number,
    images: Image[],
    conditions: Condition[],
    title: string,
    description: string,
    expiration?: Date
}

export interface AccountLinkRequest {
    id: number,
    requester: Account,
    target: Account
}

export const fromRawAccount = (raw: any): Account => ({
    id: raw.Id, name: raw.nom, balance: raw.balance, email: raw.email, hash: raw.hash,
    resources: raw.ressources ? raw.ressources.map((rawRes:any) => fromRawResource(rawRes)): [],
    linkedAccounts: raw.comptes_liés ? raw.comptes_liés.map((rawAccount: any) => fromRawAccount(rawAccount)) : [],
    invitedAccounts: raw.comptes_invites ? raw.comptes_invites.map((rawAccount: any) => fromRawAccount(rawAccount)) : [],
    invitedByAccounts: raw['comptes List1'] ? raw['comptes List1'].map((rawAccount: any) => fromRawAccount(rawAccount)) : [],
    recoveryCode: raw.code_restauration,
    expirationRecoveryCode: raw.expiration_code_restauration
})

export const fromRawResource = (raw: any): Resource => ({
    id: raw.Id,
    title: raw.titre,
    description: raw.description,
    expiration: raw.expiration,
    images: raw.images,
    conditions: raw.conditions ? conditionsFromRaw(raw.conditions): []
})

export const conditionsFromRaw = (raws: any[]): Condition[] => {
    return raws.map((raw: any) => ({
        id: raw.Id as number,
        title: raw.titre as string,
        description: raw.description as string
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