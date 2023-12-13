import { getJwt } from "@/server/apiutil"
import { NextApiRequest, NextApiResponse } from "next"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { ConversationData, fromRawAccount, fromRawResource } from "@/schema"
import { create, getOne, link, list } from "@/server/noco"

export const createMessage = async (authorParticipantId: string, otherParticipantsIds: number[], text: string, image: string): Promise<any> => {
    const message = await create('messages', { envoye: new Date(), texte: text})

    if(image) {

    }
    
    await Promise.all([
        link('messages', message.Id, 'participant', authorParticipantId),
        ...otherParticipantsIds.map((partId: number) => link('participants', partId, 'messages_non_lus', message.Id))
    ])
        
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
            if(participantsInfo.length > 0) {
                const conversationIds = participantsInfo.map((info: any) => info.conversationId)
    
                const conversations = await list('conversations', '', [], {
                    query: {
                        'where': `(Id,in,${conversationIds.join(',')})`,
                        'fields': 'Id,dernier_message,participants List,ressource,code',
                        'nested[ressource][fields]': 'Id,titre,images,comptes,donOk,trocOk',
                        'nested[participants List][fields]': 'Id,compte,messages_non_lus',
                    }
                })
                respondWithSuccess(res, conversations.map((conversation: any) => {
                    const unreads = conversation['participants List'].find((part: any) => part.compte[0].Id === account.Id)!.messages_non_lus

                    return { 
                        conversation: {
                            id: conversation.Id,
                            lastMessageExcerpt: conversation.dernier_message && conversation.dernier_message.length > 0 && conversation.dernier_message[0].texte,
                            code: conversation.code,
                            resource: fromRawResource(conversation.ressource[0]),
                            hasUnread:  unreads && unreads.length > 0
                        },
                        withUser: fromRawAccount(conversation['participants List'].find((part: any) => part.compte[0].Id != account.Id)!.compte[0]),
                    } as ConversationData
                }))
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