import { getInvitableAccounts } from "@/server/dal/user";
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'GET') {
        try {
            const { search } = req.query
            if(search && search.length >= 3) {
                const accounts = await getInvitableAccounts(search as string, getToken(req))
                
                respondWithSuccess(res, accounts)
            } else {
                respondWithSuccess(res, [])
            }
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}