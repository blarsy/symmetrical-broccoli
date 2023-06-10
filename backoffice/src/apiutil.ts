import { JwtPayload, verify } from "jsonwebtoken"
import { list } from "./noco"

export interface Account {
    name: string,
    id: string,
    email: string,
    balance: number,
    hash: string,
    resources: any[]
}

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
    const accounts = await list('comptes', query, fields || ['Id', 'nom', 'email', 'balance'])
    if(accounts.length === 1) {
        return {
            id: accounts[0].Id,
            name: accounts[0].nom,
            email: accounts[0].email,
            balance: accounts[0].balance,
            hash: accounts[0].hash,
            resources: accounts[0].ressources
        }
    }
    throw new Error('Error when querying for logged in account.')
}

export const getAccount = async (token: string): Promise<Account> => {
    const jwt = await getJwt(token)
    return queryAccount(`(email,eq,${jwt.email})`)
}
