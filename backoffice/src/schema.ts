export interface Account {
    name: string,
    id: string,
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

export enum ResourceStatus {
    active,
    expired
}

export interface Resource {
    id: string,
    images: Image[],
    title: string,
    description: string,
    status: ResourceStatus,
    expiration: Date
}