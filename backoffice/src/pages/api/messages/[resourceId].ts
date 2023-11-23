import { getJwt } from "@/server/apiutil"
import { NextApiRequest, NextApiResponse } from "next"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { Message, fromRawAccount } from "@/schema"
import { bulkCreate, create, getOne, link, list } from "@/server/noco"
import { createMessage } from "../conversations"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'GET') {
        try {
            const jwt = await getJwt(getToken(req))
            const { resourceId } = req.query

            //Select the account & participants list
            const accountPromise = getOne('comptes', `(email,eq,${jwt.email})`, ['Id', 'participants List'])

            //Select the resource with convo's & participants list
            const resource = await getOne('ressources', '', ['Id'], {
                query: {
                    'where': `(Id,eq,${resourceId})`,
                    'fields': 'Id,conversations List',
                    'nested[conversations List][fields]': 'Id,participants List',
                }
            })

            const account = await accountPromise

            //Find the conversation that has a participant match, along with the matching participant
            const participant = account['participants List'].find((part: any) => resource['conversations List'].find((conv: any) => conv['participants List'].some((convpart: any) => convpart.Id === part.Id)))
            
            if(!participant) {
                respondWithSuccess(res, [])
            } else {
                const conversation = resource['conversations List'].find((conv: any) => conv['participants List'].some((convpart: any) => convpart.Id === participant.Id))
            
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
            }
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else if(req.method === 'POST') {
        try{
            const jwt = await getJwt(getToken(req))
            const { resourceId } = req.query
            const { messages } : { messages: { text: string, image: string }[]} = req.body

            //Select the account & participants list
            const accountPromise = getOne('comptes', `(email,eq,${jwt.email})`, ['Id', 'participants List'])

            //Select the resource with convo's & participants list
            const resource = await getOne('ressources', '', ['Id'], {
                query: {
                    'where': `(Id,eq,${resourceId})`,
                    'fields': 'Id,conversations List',
                    'nested[conversations List][fields]': 'Id,participants List',
                }
            })

            const account = await accountPromise

            //Find the conversation that has a participant match, along with the matching participant
            let participant = account['participants List'].find((part: any) => resource['conversations List'].some((conv: any) => conv['participants List'].some((convpart: any) => convpart.Id === part.Id)))
            
            let conversationId: number
            if(!participant) {
                const conversation = await create('conversations', { demarre: new Date() })
                await link('conversations', conversation.Id, 'resssource', resourceId as string)
        
                const participants = await bulkCreate('participants', [{ rejoint: new Date() }, { rejoint: new Date() }])
                await Promise.all([
                    link('participants', participants[0].Id, 'conversation', conversation.Id),
                    link('participants', participants[1].Id, 'conversation', conversation.Id),
                    link('participants', participants[0].Id, 'compte', resource.account!.id.toString()),
                    link('participants', participants[1].Id, 'compte', account.id.toString()),
                ])
                conversationId = conversation.Id
                participant = participants[1]
                participant.conversation = conversation
            } else {
                const conversation = resource['conversations List'].find((conv: any) => conv['participants List'].some((convpart: any) => convpart.Id === participant.Id))
                conversationId = conversation.Id
                participant.conversation = conversation
            }

            //Create the messages on the participant
            const newMessages = await Promise.all(messages.map(m => createMessage(participant, m.text, m.image)))
    
            //Link the latest message to the convo
            await link('conversations', conversationId, 'dernier_message', newMessages[newMessages.length- 1].Id)
            
            respondWithSuccess(res, newMessages)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}