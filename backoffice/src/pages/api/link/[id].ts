
import { getCommonConfig } from "@/config/index"
import { respondWithFailure } from "@/server/respond"
import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const config = await getCommonConfig()
    if(req.method === 'GET') {
        try {
            const { id } = req.query
            if(id === '1') {
                res.redirect(config.link1Url)
            } else if(id === '2') {
                res.redirect(config.link2Url)
            } else {
                respondWithFailure(req, res, new Error('not found'), 404)
            }
            
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}