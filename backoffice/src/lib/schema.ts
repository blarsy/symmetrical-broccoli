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