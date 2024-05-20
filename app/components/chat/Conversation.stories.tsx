import type { Meta, StoryObj } from '@storybook/react'

import React = require('react')
import { apolloClientMocksDecorator, appContextDecorator, conversationContextDecorator, navigationContainerDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import Conversation from './Conversation'

const meta: Meta<typeof Conversation> = {
  component: Conversation,
  decorators: [
    paperProviderDecorator,
    appContextDecorator,
    conversationContextDecorator({
      conversation: {
        loading: false,
        error: undefined,
        data: {
          resource: { id: 3, title: 'title', images: [], description: 'description', categories: [], 
            isService: false, isProduct: false, canBeTakenAway: false, canBeDelivered: false, canBeGifted: false,
            canBeExchanged: false, created: new Date()},
          otherAccount: { name: 'otherAccountName', id: 2 } ,
          messages: [
            { _id: 2, text: 'message 1', user: { _id: 2, name: 'otherAccountName' }, createdAt: new Date() },
            { _id: 1, text: 'message 2', user: { _id: 1, name: 'me' }, createdAt: new Date() },
          ]
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
  decorators: [
    apolloClientMocksDecorator([])
  ],
  args: {
    route: {
      params: {
        resourceId: 1,
        otherAccountId: 2
      }
    }
  }
}

export const CantChatWithDeletedAccount: Story = {
  name: 'Cannot chat with deleted account', decorators: [
    apolloClientMocksDecorator([]),
    conversationContextDecorator({
      conversation: {
        loading: false,
        error: undefined,
        data: {
          resource: { id: 3, title: 'title', images: [], description: 'description', categories: [], 
            isService: false, isProduct: false, canBeTakenAway: false, canBeDelivered: false, canBeGifted: false,
            canBeExchanged: false, created: new Date()},
          otherAccount: { name: '', id: 2 } ,
          messages: [
            { _id: 2, text: 'message 1', user: { _id: 2, name: 'otherAccountName' }, createdAt: new Date() },
            { _id: 1, text: 'message 2', user: { _id: 1, name: 'me' }, createdAt: new Date() },
          ]
        },
      }
    })
  ],
  args: {
    route: {
      params: {
        resourceId: 1,
        otherAccountId: 2
      }
    }
  }
}