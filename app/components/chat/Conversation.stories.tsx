import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import { apolloClientMocksDecorator, appContextDecorator, conversationContextDecorator, navigationContainerDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import Conversation, { SET_PARTICIPANT_READ } from './Conversation'

const meta: Meta<typeof Conversation> = {
  component: Conversation,
  decorators: [
    paperProviderDecorator,
    appContextDecorator,
    apolloClientMocksDecorator([{
      query: SET_PARTICIPANT_READ,
      variables: { otherAccountId: 2, resourceId: 3 },
      result: { setParticipantRead: { integer: 1 }}
    }]),
    conversationContextDecorator({
      conversation: {
        loading: false,
        error: undefined,
        data: {
          resource: { id: 3, title: 'Une super ressource', images: [], description: 'description de la ressource', categories: [], 
            isService: false, isProduct: false, canBeTakenAway: false, canBeDelivered: false, canBeGifted: false,
            canBeExchanged: false, created: new Date()},
          otherAccount: { name: 'otherAccountName', id: 2 } ,
          messages: [
            { _id: 2, text: 'message 1', user: { _id: 2, name: 'otherAccountName' }, createdAt: new Date() },
            { _id: 1, text: 'message 2', user: { _id: 1, name: 'me' }, createdAt: new Date() },
          ],
          endCursor: ''
        },
      }
    }),
    navigationContainerDecorator()
  ]
}

export default meta
type Story = StoryObj<typeof Conversation>

export const SimpleView: Story = {
  name: 'Simple conversation',
  decorators: [],
  args: {
    route: {
      params: {
        resourceId: 3,
        otherAccountId: 2
      }
    }
  }
}

export const CantChatWithDeletedAccount: Story = {
  name: 'Cannot chat with deleted account', decorators: [
    conversationContextDecorator({
      conversation: {
        loading: false,
        error: undefined,
        data: {
          resource: { id: 3, title: 'Super ressource', images: [], description: 'description de la ressource', categories: [], 
            isService: false, isProduct: false, canBeTakenAway: false, canBeDelivered: false, canBeGifted: false,
            canBeExchanged: false, created: new Date()},
          otherAccount: { name: '', id: 2 } ,
          messages: [
            { _id: 2, text: 'message 1', user: { _id: 2, name: 'Artisan incroyable' }, createdAt: new Date() },
            { _id: 1, text: 'message 2', user: { _id: 1, name: 'Mon association super' }, createdAt: new Date() },
          ],
          endCursor: ''
        },
      }
    })
  ],
  args: {
    route: {
      params: {
        resourceId: 3,
        otherAccountId: 2
      }
    }
  }
}