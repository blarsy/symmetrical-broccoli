import { getSuggestions } from "@/server/dal/resource"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'GET') {
        try {
            let categories: string[] = []
            if(req.query.categories) {
                categories = (req.query.categories as string).split(',')
            }
            
            const resources = await getSuggestions(getToken(req), req.query.search as string, !!req.query.isProduct, !!req.query.isService, !!req.query.canBeDelivered, !!req.query.canBeTakenAway, !!req.query.canBeExchanged, !!req.query.canBeGifted, categories )
            respondWithSuccess(res, resources)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}