import { getAccount, getJwt, getResource, queryAccount } from "@/server/apiutil"
import { NextApiRequest, NextApiResponse } from "next"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { create } from "@/server/dal/resource"
import { Resource } from "@/schema"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'GET') {
        try {
            const jwt = await getJwt(getToken(req))
            const account = await queryAccount(`(email,eq,${jwt.email})`, ['Id', 'nom', 'ressources'])

            if(account.resources) {
                const resources = await Promise.all(account.resources.map((res: any) => getResource(res.id)))
                resources.forEach((res: Resource) => res.account = { id: account.id, name: account.name, email:'', balance: 0, linkedAccounts: [], recoveryCode: '', invitedAccounts: [], invitedByAccounts:[], expirationRecoveryCode: new Date() })
                
                respondWithSuccess(res, resources)
            } else {
                respondWithSuccess(res, [])
            }
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else if (req.method === 'POST') {
        try {
            const { title, description, expiration, conditions, categories } = JSON.parse(req.body)
            const account = await getAccount(getToken(req))
            const resource = await create(account.id, title, description, expiration, conditions, categories)
    
            respondWithSuccess(res, resource)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}