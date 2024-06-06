import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import { apolloClientMocksDecorator, appContextDecorator, configDayjsDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import PastConversations, { MY_CONVERSATIONS } from './PastConversations'

const fromNow = (milliseconds: number) => new Date(new Date().valueOf() - milliseconds)
const makeAConversation = (lastActivityMillisecondsFromNow: number, text: string) => (                    {
    created: new Date(),
    messageByLastMessage: {
        text,
        created: fromNow(lastActivityMillisecondsFromNow)
    },
    participantsByConversationId: {
        nodes: [
            {
                unreadMessagesByParticipantId: { totalCount: 2 },
                accountByAccountId: {
                    id: 1,
                    name: 'account 1',
                    email: 'mail1@mail.com',
                    imageByAvatarImageId: { publicId: '' }
                }
            }, 
            {
                unreadMessagesByParticipantId: { totalCount: 0 },
                accountByAccountId: {
                    id: 2,
                    name: 'account 2',
                    email: 'mail2@mail.com',
                    imageByAvatarImageId: { publicId: '' }
                }
            }
        ]
    },
    resourceByResourceId: {
        id: 1,
        canBeGifted: true,
        canBeExchanged: true,
        title: 'res 1 title',
        accountByAccountId:{
            name: 'Account 2',
            id: 2,
            email: 'mail2@mail.com',
            imageByAvatarImageId: { publicId: '' }
        },
        resourcesImagesByResourceId: {
            nodes: [{
                imageByImageId: { publicId: '' }
            }]
        }
    }
})

const meta: Meta<typeof PastConversations> = {
  component: PastConversations,
  decorators: [
    paperProviderDecorator,
    appContextDecorator,
    configDayjsDecorator,
    apolloClientMocksDecorator([{
        query: MY_CONVERSATIONS,
        result: { myConversations: {
            nodes: [
                makeAConversation(11 * 60 * 1000, 'il y a 11 minutes'),
                makeAConversation(400 * 24 * 60 * 60 * 1000, 'il y a plus d\'un an'),
                makeAConversation(3000, 'reçu il y a 3 secondes'),
                makeAConversation(24 * 60 * 60 * 1000, 'hier, même heure'),
                makeAConversation(12 * 24 * 60 * 60 * 1000, 'Il y a 12 jours'),
            ]
        } } 
    }])
  ]
}

export default meta
type Story = StoryObj<typeof PastConversations>

export const SimpleView: Story = {
  name: 'Simple conversation list',
  args: {
    onConversationSelected(resource, otherAccountId) {
        //console.log(resource, otherAccountId)
    },
  }
}