import type { Meta, StoryObj } from '@storybook/react'

import React = require('react')
import Chat from './Chat';
import { apolloClientMocksDecorator, appContextDecorator, navigationContainerDecorator, paperProviderDecorator } from '@/lib/storiesUtil';
import { CONVERSATION_MESSAGES } from '../chat/ConversationContextProvider';

const makeConversationData = (resourceId: number, otherAccountId: number, resourceDeleted: boolean, otherAccountDeleted: boolean) => (
    {
        conversationMessages: {
            nodes: [
                {
                    id: 1,
                    text: 'message 1',
                    created: new Date(),
                    received: null,
                    imageByImageId: {
                        publicId: ''
                    },
                    participantByParticipantId: {
                        accountByAccountId: {
                            id: 1,
                            name: 'my account',
                            imageByAvatarImageId: {
                                publicId: ''
                            }
                        }
                    }
                },
                {
                    id: 2,
                    text: 'message 2',
                    created: new Date(),
                    received: null,
                    imageByImageId: {
                        publicId: ''
                    },
                    participantByParticipantId: {
                        accountByAccountId: {
                            id: 2,
                            name: 'other account name',
                            imageByAvatarImageId: {
                                publicId: ''
                            }
                        }
                    }
                },
          ]},
          accountById: {
            id: otherAccountId,
            name: otherAccountDeleted ? '' : 'other account name'
          },
          resourceById: {
                accountByAccountId: {
                    email: 'other@other.com',
                    id: 2,
                    name: otherAccountDeleted ? '' : 'other account name',
                    imageByAvatarImageId: { publicId: '' }
                },
                canBeDelivered: true,
                canBeExchanged: true,
                canBeGifted: true,
                canBeTakenAway: true,
                description: 'description',
                id: resourceId,
                isProduct: true,
                isService: true,
                expiration: null,
                title: 'title',
                resourcesResourceCategoriesByResourceId: {
                    nodes: [{
                        resourceCategoryCode: 'cat2'
                    },{
                        resourceCategoryCode: 'cat4'
                    }]
                },
                resourcesImagesByResourceId: {
                    nodes: []
                },
                created: new Date(),
                deleted: resourceDeleted ? new Date() : null
          }
    }
)

const meta: Meta<typeof Chat> = {
  component: Chat,
  decorators: [
    paperProviderDecorator,
    appContextDecorator,
    navigationContainerDecorator({ routes: [
        { name: 'conversation', params: { resourceId: 1, otherAccountId: 2 } }
    ], index: 0 })
  ]
}

export default meta
type Story = StoryObj<typeof Chat>

const defaultResourceId = 1
const defaultOtherAccountId = 2

const argsForSingleConversationViews = {
    route: {
        params: { resourceId: defaultResourceId, otherAccountId: defaultOtherAccountId }
    }
}

export const SingleConversation: Story = {
    name: 'Single conversation',
    args: argsForSingleConversationViews,
    decorators: [
      apolloClientMocksDecorator([
          { 
              query: CONVERSATION_MESSAGES,
              variables: {
                  resourceId: defaultResourceId,
                  otherAccountId: defaultOtherAccountId
              },
              result: makeConversationData(defaultResourceId, defaultOtherAccountId, false, false)
          }
      ])
    ]
  }

  export const SingleConversationWithDeletedAccount: Story = {
    name: 'Single conversation with deleted account',
    args: argsForSingleConversationViews,
    decorators: [
        apolloClientMocksDecorator([
            { 
                query: CONVERSATION_MESSAGES,
                variables: {
                    resourceId: defaultResourceId,
                    otherAccountId: defaultOtherAccountId
                },
                result: makeConversationData(defaultResourceId, defaultOtherAccountId, false, true)
            }
        ])
    ]
}

export const SingleConversationAboutDeletedResource: Story = {
    name: 'Single conversation about deleted resource',
    args: argsForSingleConversationViews,
    decorators: [
        apolloClientMocksDecorator([
            { 
                query: CONVERSATION_MESSAGES,
                variables: {
                    resourceId: defaultResourceId,
                    otherAccountId: defaultOtherAccountId
                },
                result: makeConversationData(defaultResourceId, defaultOtherAccountId, true, false)
            }
        ])
    ]
}
