import { getSuggestions } from "@/server/dal/resource"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'GET') {
        try {
            const resources = await getSuggestions(getToken(req))
            respondWithSuccess(res, resources)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}