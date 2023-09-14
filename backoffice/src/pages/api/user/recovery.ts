import { recover, requestRecovery } from "@/server/dal/user"
import { respondWithFailure, respondWithSuccess } from "@/server/respond"
import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'PUT') {
        try {
            const { email } = req.body
            await requestRecovery(email)
            respondWithSuccess(res)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else if(req.method === 'POST') {
        try {
            const { id, password } = req.body
            await recover(id, password)
            respondWithSuccess(res)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}