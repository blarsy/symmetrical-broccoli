import { getJwt } from "@/server/apiutil"
import { NextApiRequest } from "next"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { getOne } from "@/server/noco"
import { NextApiResponseServerIO } from "@/types/next"

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
    if(req.method === 'GET') {
        try {
            const jwt = await getJwt(getToken(req))
            const { resourceId } = req.query

            //Select the account & participants list
            const account = await getOne('comptes', `(email,eq,${jwt.email})`, ['Id', 'ressources', 'participants List'])
            const resource = await getOne('ressources', '', ['Id'], {
                query: {
                    'where': `(Id,eq,${resourceId})`,
                    'fields': 'Id,conversations List',
                    'nested[conversations List][fields]': 'Id,code,participants List'
                }
            })
            const conversation = resource['conversations List'].find((conv: any) => conv['participants List'].some((part: any) => account['participants List'].some((accPart: any) => accPart.Id === part.Id)))

            //Select the resource with convo's & participants list
            respondWithSuccess(res, conversation)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}