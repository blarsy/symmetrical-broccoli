import { respondWithFailure } from "@/server/respond"
import { NextApiRequest, NextApiResponse } from "next"

const link1Url = process.env.LINK1_URL as string

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'GET') {
        try {
            const { id } = req.query
            if(id === '1') {
                res.redirect(link1Url)
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