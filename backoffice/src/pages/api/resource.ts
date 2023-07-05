import { getAccount, getJwt, queryAccount } from "@/server/apiutil"
import { bulkCreate, create, link } from "@/server/noco"
import { conditionsToRaw } from "@/schema"
import { NextApiRequest, NextApiResponse } from "next"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'GET') {
        try {
            const jwt = await getJwt(getToken(req))
            const account = await queryAccount(`(email,eq,${jwt.email})`, ['Id', 'ressources'])
            
            respondWithSuccess(res, account.resources)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else if (req.method === 'POST') {
        try {
            const { title, description, expiration, conditions } = req.body
    
            const account = await getAccount(getToken(req))
            const resource = await create('ressources', { titre: title , description, expiration })
            await link('comptes', account.id, 'ressources', resource.Id)

            const conditionsRes = await bulkCreate('conditions', conditionsToRaw(conditions))
            
            await Promise.all(conditionsRes.map(async (condition: any) => {
                return link('ressources', resource.Id, 'conditions', condition.id)
            }))
    
            respondWithSuccess(res, resource)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        respondWithFailure(req, res, new Error('Not implemented'), 405)
    }
}