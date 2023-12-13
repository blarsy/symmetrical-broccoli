import { getJwt } from "../apiutil"
import { getOne, unlink } from "../noco"

export const setMessageRead = async (token: string, messageId: number) => {
    const jwt = await getJwt(token)
    const account = await getOne('comptes', '', ['Id'], {
        query: {
            'where': `(email,eq,${jwt.email})`,
            'fields': 'Id,participants List',
            'nested[participants List][fields]': 'Id,messages_non_lus'
        }
    })
    
    const accountParticipant = account['participants List'].find((part: any) => part.messages_non_lus.find((msg: any) => msg.Id === messageId))

    if(accountParticipant) {
        const participant = await getOne('participants', '', ['Id'], {
            query: {
                'where': `(Id,eq,${accountParticipant.Id})`,
                'fields': 'Id,messages_non_lus',
                'nested[messages_non_lus][fields]': 'Id,CreatedAt',
            }
        })
        
        const message = participant.messages_non_lus.find((msg: any) => msg.Id === messageId)

        if(!message) throw new Error('Message not found')
        return Promise.all(participant.messages_non_lus = participant.messages_non_lus
            .filter((msg: any) => msg.CreatedAt <= message.CreatedAt)
            .map((msg: any) => unlink('participants', participant.Id, 'messages_non_lus', msg.Id)))
    }
}