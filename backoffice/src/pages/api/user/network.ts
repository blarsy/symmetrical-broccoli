import { getJwt, queryAccount } from "@/server/apiutil"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { NextApiRequest, NextApiResponse } from "next"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'GET') {
        try {
            const jwt = await getJwt(getToken(req))
            const account = await queryAccount('', ['Id', 'comptes_liés', 'comptes_invites', 'comptes List1'], {
                query: {
                    'where': `(email,eq,${jwt.email})`,
                    'nested[comptes List1][fields]': 'nom,email,Id',
                    'nested[comptes_liés][fields]': 'nom,email,Id',
                    'nested[comptes_invites][fields]': 'nom,email,Id',
                }
            })

            respondWithSuccess(res, { linkRequests: account.invitedAccounts, 
                linkedAccounts: account.linkedAccounts, receivedLinkRequests: account.invitedByAccounts })
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        respondWithFailure(req, res, new Error('Not implemented'), 405)
    }
}