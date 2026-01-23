import type { Meta, StoryObj } from '@storybook/react';

import { apolloClientMocksDecorator, appContextDecorator, conversationContextDecorator, gestureHandlerDecorator, navigationContainerDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import Conversation, { CREATE_MESSAGE, SET_PARTICIPANT_READ } from './Conversation'
import { initial } from '@/lib/DataLoadState'

const someMessages = [
  { id: 2, text: 'message 1', user: { id: 2, name: 'otherAccountName', avatar: '' }, createdAt: new Date() },
  { id: 1, text: 'message 2', user: { id: 1, name: 'me', avatar: '' }, createdAt: new Date() },
]

const meta: Meta<typeof Conversation> = {
  component: Conversation,
  decorators: [
    paperProviderDecorator,
    appContextDecorator(),
    gestureHandlerDecorator,
    apolloClientMocksDecorator([{
      query: SET_PARTICIPANT_READ,
      variables: { otherAccountId: 2, resourceId: 3 },
      result: { setParticipantRead: { integer: 1 }}
    }, { query: CREATE_MESSAGE,
        variables: { text: 'test message', resourceId: 3, otherAccountId: 2, imagePublicId: '' },
        result: { createMessage: {integer: 1 } }
    }]),
    conversationContextDecorator({
        loading: false,
        error: undefined,
        data: {
          id: 1,
          participantId: 1,
          resource: { id: 3, title: 'Une super ressource', images: [], description: 'description de la ressource', categories: [], 
            isService: false, isProduct: false, canBeTakenAway: false, canBeDelivered: false, canBeGifted: false,
            canBeExchanged: false, created: new Date(), deleted: null, specificLocation: null},
          otherAccount: { name: 'otherAccountName', id: 2 } ,
        }
    }, {
        messages: initial(false, someMessages),
        endCursor: ''
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
      name: 'test',
      params: {
        resourceId: 3,
        otherAccountId: 2
      }
    }
  }
}

export const CantChatWithDeletedAccount: Story = {
  name: 'Cannot chat with deleted account', decorators: [
    conversationContextDecorator(
      initial(false, {
        id: 1,
        participantId: 1,
        resource: { id: 3, title: 'Super ressource', images: [], description: 'description de la ressource', categories: [], 
          isService: false, isProduct: false, canBeTakenAway: false, canBeDelivered: false, canBeGifted: false,
          canBeExchanged: false, created: new Date(), deleted: null, specificLocation: null},
        otherAccount: { name: '', id: 2 } ,
      }), {
        messages: initial(false,[
          { id: 2, text: 'message 1', user: { id: 2, name: 'Artisan incroyable', avatar: '' }, createdAt: new Date() },
          { id: 1, text: 'message 2', user: { id: 1, name: 'Mon association super', avatar: '' }, createdAt: new Date() },
        ]),
        endCursor: ''
      })
  ],
  args: {
    route: {
      name: 'test',
      params: {
        resourceId: 3,
        otherAccountId: 2
      }
    }
  }
}