import { getJwt } from "@/server/apiutil"
import { NextApiRequest, NextApiResponse } from "next"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { Message, fromRawAccount } from "@/schema"
import { getOne, list } from "@/server/noco"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'GET') {
        try {
            const jwt = await getJwt(getToken(req))
            const { conversationId } = req.query
            const accountPromise = getOne('comptes', `(email,eq,${jwt.email})`, ['Id', 'participants List'])
            const conversation = await getOne('conversations', `(Id,eq,${conversationId})`, ['Id','participants List'])

            const account = await accountPromise
            
            if(!account['participants List'].some((accountPart: any) => conversation['participants List'].find((convPart: any) => convPart.Id === accountPart.Id  )))
                respondWithFailure(req, res, 'Incorrect conversation')

            const participantsMessages = await list('participants', '', [], { query: {
                'where': `(Id,in,${conversation['participants List'].map((convPart: any) => convPart.Id).join(',')})`,
                'fields': 'Id,messages List,compte',
                'nested[messages List][fields]': 'Id,texte,participant,image,envoye',
            }})
            
            let messages: any[] = []
            participantsMessages.forEach((pm: any) => messages = messages.concat(pm['messages List'].map((msg: any) => ({
                id: msg.Id, text: msg.texte, created: new Date(msg.envoye), from: fromRawAccount(pm.compte[0])
            } as Message))))
            messages = messages.sort((a:any, b:any) => a.created > b.created ? -1 : 1)

            respondWithSuccess(res, messages)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}