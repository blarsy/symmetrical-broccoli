import { linkRequestFromRaw } from "@/schema"
import { getJwt, queryAccount } from "@/server/apiutil"
import { answerInvite, invite, uninvite } from "@/server/dal/user"
import { create, getOne, link, list, remove } from "@/server/noco"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { NextApiRequest, NextApiResponse } from "next"

const getRequest = async (requester: string, targetAccount: number) => {
    const myRequests = await list('demandes_liaison_comptes', `nested[demandeur][where]=(Id,eq,${requester})`, ['Id', 'demandeur', 'cible'])
    console.log(JSON.stringify(myRequests), 'targetAccount', targetAccount)
    return myRequests.find((request: any) => request.cible.length > 0 && request.cible[0].Id === targetAccount)
}

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
    } else if (req.method === 'DELETE') {
        try {         
            const { target } = req.query
            if(target) {
                const jwt = await getJwt(getToken(req))
                await uninvite(jwt.email, target as string)
    
                respondWithSuccess(res)
            } else {
                respondWithFailure(req, res, new Error('Missing parameter'), 400)
            }
        } catch (e: any) {
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
        respondWithFailure(req, res, new Error('Not implemented'), 405)
    }
}