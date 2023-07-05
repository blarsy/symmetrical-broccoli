import { JwtPayload, sign, verify } from "jsonwebtoken"
import { getOne } from "./noco"
import { Account, Resource } from "../schema"

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
    const account = await getOne('comptes', query, fields || ['Id', 'nom', 'email', 'balance', 'ressources'])

    if(!account) throw new Error(`No account found with query ${query}.`)
    return {
        id: account.Id,
        name: account.nom,
        email: account.email,
        balance: account.balance,
        hash: account.hash,
        resources: account.ressources ? account.ressources.map((rawResource: any): Resource => ({
            id: rawResource.Id,
            description: rawResource.description,
            title: rawResource.titre,
            expiration: new Date(rawResource.expiration),
            images: rawResource.images,
            conditions: rawResource.conditions
        })) : []
    }
}

export const getAccount = async (token: string): Promise<Account> => {
    const jwt = await getJwt(token)
    return queryAccount(`(email,eq,${jwt.email})`)
}

export const createToken = async (secret: string, data: any): Promise<string> => {
    return new Promise((resolve, reject) => {
      data.exp = Date.now() / 1000 + (60 * 60 * 24 * 2)
      sign(data, secret, (err: Error | null, token?: string) => {
        if(err) reject(err)
        resolve(token!)
      })
    })
  }