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
    id: number
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
    conditions: conditionsFromRaw(raw.conditions)
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