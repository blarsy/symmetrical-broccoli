import { ensureDataStoreCreated } from "@/server/noco"
import { respondWithFailure, respondWithSuccess } from "@/server/respond"
import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'GET') {
        try {
            await ensureDataStoreCreated()
            
            respondWithSuccess(res)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        respondWithFailure(req, res, new Error('Not implemented'), 405)
    }
}