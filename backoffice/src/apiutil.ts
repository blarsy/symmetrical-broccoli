import { JwtPayload, verify } from "jsonwebtoken"
import { list } from "./noco"
import { Account, Resource, ResourceStatus } from "./schema"

const secret = process.env.JWT_SECRET as string

export const getJwt = async (token: string): Promise<JwtPayload> => {
    return new Promise((resolve, reject) => {
        verify(token, secret, (err, payload) => {
            if(err) reject(err)
            else resolve(payload as JwtPayload)
        })
    })
}

export const queryAccount = async (query: string, fields?: string[]): Promise<Account> => {
    const accounts = await list('comptes', query, fields || ['Id', 'nom', 'email', 'balance', 'ressources'])
    if(accounts.length === 1) {
        return {
            id: accounts[0].Id,
            name: accounts[0].nom,
            email: accounts[0].email,
            balance: accounts[0].balance,
            hash: accounts[0].hash,
            resources: accounts[0].ressources ? accounts[0].ressources.map((rawResource: any): Resource => ({
                id: rawResource.Id,
                description: rawResource.description,
                title: rawResource.titre,
                status: rawResource.status === 'actif' ? ResourceStatus.active : ResourceStatus.expired,
                expiration: new Date(rawResource.expiration),
                images: rawResource.images
            })) : []
        }
    }
    throw new Error(`Error when querying for account with query ${query}.`)
}

export const getAccount = async (token: string): Promise<Account> => {
    const jwt = await getJwt(token)
    return queryAccount(`(email,eq,${jwt.email})`)
}