import { getJwt } from "@/server/apiutil"
import { NextApiRequest } from "next"
import { getToken, respondWithFailure, respondWithSuccess } from "@/server/respond"
import { Message, fromRawAccount, fromRawMessage } from "@/schema"
import { bulkCreate, create, getOne, link, list, unlink } from "@/server/noco"
import { createMessage } from "../conversations"
import { NextApiResponseServerIO } from "@/types/next"
import { generateCode } from "@/utils"
import { Server } from "socket.io"
import { DefaultEventsMap } from "socket.io/dist/typed-events"
import { getParticipantForResource } from "@/server/dal/resource"

export default async function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
    if(req.method === 'GET') {
        try {
            const { resourceId } = req.query
            const data = await getParticipantForResource(getToken(req), resourceId as string)
            
            if(!data.participant) {
                respondWithSuccess(res, [])
            } else {
                const conversation = data.resource['conversations List'].find((conv: any) => conv['participants List'].some((convpart: any) => convpart.Id === data.participant.Id))
            
                const participantsMessages = await list('participants', '', [], { query: {
                    'where': `(Id,in,${conversation['participants List'].map((convPart: any) => convPart.Id).join(',')})`,
                    'fields': 'Id,messages List,compte',
                    'nested[messages List][fields]': 'Id,texte,participant,image,envoye',
                    'nested[messages List][sort]': '-CreatedAt'
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
            const { resourceId } = req.query
            const { messages } : { messages: { text: string, image: string }[]} = req.body
            const data = await getParticipantForResource(getToken(req), resourceId as string)
            
            let participantId: string
            let conversation: any
            if(!data.participant) {
                conversation = await create('conversations', { demarre: new Date(), code: generateCode(8) })
                await link('conversations', conversation.Id, 'ressource', resourceId as string)
        
                const participants = await bulkCreate('participants', [{ rejoint: new Date() }, { rejoint: new Date() }])
                
                await Promise.all([
                    link('participants', participants[0].id, 'conversation', conversation.Id),
                    link('participants', participants[1].id, 'conversation', conversation.Id),
                    link('participants', participants[0].id, 'compte', data.resource.comptes.Id),
                    link('participants', participants[1].id, 'compte', data.account.Id),
                ])

                //'bulkCreate' creates items with an 'id' property, where I would expect 'Id' as everywhere else in the Nocodb api.
                //work around this by making the following chitty tranformation
                conversation['participants List'] = participants.map((part: any) => ({ Id: part.id }))
                participantId = participants[1].id
            } else {
                conversation = data.resource['conversations List'].find((conv: any) => conv['participants List'].some((convpart: any) => convpart.Id === data.participant.Id))
                participantId = data.participant.Id
            }
            
            //Create the messages on the participant
            const newMessages = await Promise.all(messages.map(m => createMessage(participantId, conversation['participants List'].filter((part:any) => part.Id != participantId).map((part:any) => part.Id), m.text, m.image)))

            //Link the latest message to the convo
            if(conversation.dernier_message && conversation.dernier_message.length > 0) await unlink('conversations', conversation.Id, 'dernier_message', conversation.dernier_message[0].Id )
            await link('conversations', conversation.Id, 'dernier_message', newMessages[newMessages.length- 1].Id.toString())

            newMessages.forEach(msg => emitMessageInConversation(res.socket.server.io, conversation.Id, msg))
            
            respondWithSuccess(res, newMessages)
        } catch(e: any) {
            respondWithFailure(req, res, e)
        }
    } else {
        res.end()
    }
}

async function emitMessageInConversation(io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, conversationId: number, msg: any): Promise<void> {
    const socketsPromise = await io.fetchSockets()
    const conversation = await getOne('conversations', '',['Id'], {
        query: {
            'where': `(Id,eq,${conversationId})`,
            'fields': 'Id,participants List,code,ressource',
            'nested[participants List][fields]' : 'Id,compte'
        }
    })

    const sockets = await socketsPromise
    sockets.filter(socket => socket.data.account && conversation['participants List'].some((part: any) => part.compte[0].Id === socket.data.account.id)).forEach(socket => {
        socket.join(conversation.code)
    })

    const message = fromRawMessage(await getOne('messages', '', ['Id'], {
        query: {
            'where': `(Id,eq,${msg.Id})`,
            'fields': 'Id,participant,texte,image,conversations,CreatedAt',
            'nested[participant][fields]': 'Id,compte'
        }
    }))

    io.in(conversation.code).emit('chat_message', { message, resourceId: conversation.ressource[0].Id })
}
