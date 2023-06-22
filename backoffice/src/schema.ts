export interface Account {
    name: string,
    id: number,
    email: string,
    balance: number,
    hash: string,
    resources: Resource[]
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
    resourceId: number
}

export interface Resource {
    id: number,
    images: Image[],
    conditions: Condition[],
    title: string,
    description: string,
    expiration?: Date
}

export const fromRawResource = (raw: any): Resource => ({
    id: raw.Id,
    title: raw.titre,
    description: raw.description,
    expiration: raw.expiration,
    images: raw.images,
    conditions: raw.conditions
})