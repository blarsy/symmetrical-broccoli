import { getAccount, getJwt, queryAccount } from "@/server/apiutil"
import { NextApiRequest, NextApiResponse } from "next"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { create } from "@/server/dal/resource"
import { getChildItems } from "@/server/noco"
import { fromRawResource } from "@/schema"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'GET') {
        try {
            const jwt = await getJwt(getToken(req))
            const account = await queryAccount(`(email,eq,${jwt.email})`, ['Id', 'ressources'])
            const resources = await getChildItems('comptes', account.id, 'ressources')
            await Promise.all(resources.map(async (resource) => resource.conditions = await getChildItems('ressources', resource.Id, 'conditions')))
            
            respondWithSuccess(res, resources.map(res => fromRawResource(res)))
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else if (req.method === 'POST') {
        try {
            const { title, description, expiration, conditions } = JSON.parse(req.body)
            const account = await getAccount(getToken(req))
            const resource = await create(account.id, title, description, expiration, conditions)
    
            respondWithSuccess(res, resource)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}