import { getJwt } from "@/server/apiutil"
import { answerInvite, invite, uninvite } from "@/server/dal/user"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        try {
            const { target } = req.body
            const jwt = await getJwt(getToken(req))

            await invite(jwt.email, target)

            respondWithSuccess(res)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else if (req.method === 'PATCH') {
        try {         
            const { target, accept } = req.body

            if(target) {
                const jwt = await getJwt(getToken(req))
                await answerInvite(jwt.email, target, accept)

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