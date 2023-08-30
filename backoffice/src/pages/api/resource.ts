import { getAccount, getJwt, queryAccount } from "@/server/apiutil"
import { NextApiRequest, NextApiResponse } from "next"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { create } from "@/server/dal/resource"

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
            const resource = await create(account.id, title, description, expiration, conditions)
    
            respondWithSuccess(res, resource)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}