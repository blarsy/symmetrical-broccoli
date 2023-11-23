import { getJwt } from "@/server/apiutil"
import { NextApiRequest, NextApiResponse } from "next"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { ConversationData, fromRawAccount } from "@/schema"
import { create, getOne, link, list } from "@/server/noco"

export const createMessage = async (participant: any, text: string, image: string): Promise<any> => {
    const message = await create('messages', { envoye: new Date(), texte: text})
    if(image) {

    }
    //const linkConvoPromise = link('conversations', participant.conversation.Id.toString(), 'dernier_message', message.Id.toString())

     await link('messages', message.Id, 'participant', participant.Id.toString())
    //await linkConvoPromise
    return message
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if(req.method === 'GET') {
        try {
            const jwt = await getJwt(getToken(req))
            const account = await getOne('comptes', '', ['Id'], {
                query: {
                    'where': `(email,eq,${jwt.email})`,
                    'fields': 'Id,participants List',
                    'nested[participants List][fields]': 'Id,compte,conversation'
                }
            })

            const participantsInfo = account['participants List'].map((participant: any) => ({ account: participant.compte[0], conversationId: participant.conversation[0].Id }))
            const conversationIds = participantsInfo.map((info: any) => info.conversationId)

            const conversations = await list('conversations', '', [], {
                query: {
                'where': `(Id,in,${conversationIds.join(',')})`,
                'fields': 'Id,dernier_message,participants List,ressource',
                'nested[ressource][fields]': 'Id,titre',
                'nested[participants List][fields]': 'Id,compte',
            }})

            respondWithSuccess(res, conversations.map((conversation: any) => ({ 
                conversation: {
                    id: conversation.Id,
                    ressourceTitle: conversation.ressource[0].titre,
                    resourceId: conversation.ressource[0].Id,
                    lastMessageExcerpt: conversation.dernier_message[0].texte
                },
                withUser: fromRawAccount(conversation['participants List'].find((part: any) => part.compte[0].Id != account.Id)!.compte[0]),
            } as ConversationData)))
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}