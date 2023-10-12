import { JwtPayload, sign, verify } from "jsonwebtoken"
import { getChildItems, getOne } from "./noco"
import { Account, Resource, fromRawAccount, fromRawResource } from "../schema"
import { RequestParams } from "nocodb-sdk"

const secret = process.env.JWT_SECRET as string

export const getJwt = async (token: string): Promise<JwtPayload> => {
    return new Promise((resolve, reject) => {
        verify(token, secret, (err, payload) => {
            if(err) reject(err)
            else resolve(payload as JwtPayload)
        })
    })
}

export const queryAccount = async (query: string, fields?: string[], otherParams?: RequestParams): Promise<Account> => {
    const account = await getOne('comptes', query, fields || ['Id', 'nom', 'email', 'balance', 'ressources'], otherParams)

    if(!account) throw new Error(`No account found with query ${query}.`)
    return fromRawAccount(account)
}

export const getAccount = async (token: string, fields?: string[]): Promise<Account> => {
    const jwt = await getJwt(token)
    return queryAccount(`(email,eq,${jwt.email})`, fields)
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

export const getResource = async(resourceId: number): Promise<Resource> => {
    const resource = await getOne('ressources', `(Id,eq,${resourceId})`, ['Id', 'titre', 'description', 'images', 'conditions', 'expiration'])
    const conditions = await getChildItems('conditions', resource.Id, 'ressources')
    resource.conditions = conditions
    return fromRawResource(resource)
}