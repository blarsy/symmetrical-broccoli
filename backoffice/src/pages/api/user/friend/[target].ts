import { getJwt } from "@/server/apiutil"
import { removeFriend } from "@/server/dal/user"
import { getToken, respondWithSuccess, respondWithFailure } from "@/server/respond"
import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'DELETE') {
        try {
            const { target } = req.query
            if(target) {
                await removeFriend(getToken(req), target as string)

                respondWithSuccess(res)
            } else {
                respondWithFailure(req, res, new Error('Missing parameter'), 400)
            }
        } catch (e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}