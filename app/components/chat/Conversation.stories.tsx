import type { Meta, StoryObj } from '@storybook/react';

import { apolloClientMocksDecorator, appContextDecorator, conversationContextDecorator, gestureHandlerDecorator, navigationContainerDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import Conversation, { CREATE_MESSAGE, SET_PARTICIPANT_READ } from './Conversation'
import { initial } from '@/lib/DataLoadState'
import { v4 } from 'uuid';

const someMessages = [
  { id: v4(), text: 'message 1', user: { id: v4(), name: 'otherAccountName', avatar: '' }, createdAt: new Date() },
  { id: v4(), text: 'message 2', user: { id: v4(), name: 'me', avatar: '' }, createdAt: new Date() },
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
        result: { createMessage: {uuid: v4() } }
    }]),
    conversationContextDecorator({
        loading: false,
        error: undefined,
        data: {
          id: v4(),
          participantId: v4(),
          resource: { id: v4(), title: 'Une super ressource', images: [], description: 'description de la ressource', categories: [], 
            isService: false, isProduct: false, canBeTakenAway: false, canBeDelivered: false, canBeGifted: false,
            canBeExchanged: false, created: new Date(), deleted: null, specificLocation: null, price: 100, inActiveCampaign: false},
          otherAccount: { name: 'otherAccountName', id: v4() } ,
        }
    }, {
        messages: initial(false, someMessages),
        endCursor: '', loadingEarlier: false
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
        id: v4(),
        participantId: v4(),
        resource: { id: v4(), title: 'Super ressource', images: [], description: 'description de la ressource', categories: [], 
          isService: false, isProduct: false, canBeTakenAway: false, canBeDelivered: false, canBeGifted: false,
          canBeExchanged: false, created: new Date(), deleted: null, specificLocation: null, price: 100, inActiveCampaign: false},
        otherAccount: { name: '', id: v4() } ,
      }), {
        messages: initial(false,[
          { id: v4(), text: 'message 1', user: { id: v4(), name: 'Artisan incroyable', avatar: '' }, createdAt: new Date() },
          { id: v4(), text: 'message 2', user: { id: v4(), name: 'Mon association super', avatar: '' }, createdAt: new Date() },
        ]),
        endCursor: '', loadingEarlier: false
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