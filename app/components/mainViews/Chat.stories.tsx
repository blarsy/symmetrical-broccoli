import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import Chat from './Chat';
import { apolloClientMocksDecorator, appContextDecorator, navigationContainerDecorator, paperProviderDecorator } from '@/lib/storiesUtil';
import { CONVERSATION_MESSAGES } from '../chat/ConversationContextProvider';

const makeConversationData = (resourceId: number, otherAccountId: number, resourceDeleted: boolean, otherAccountDeleted: boolean) => (
    {
        conversationMessages: {
            pageInfo: {
                hasNextPage: true,
                endCursor: "WyJuYXR1cmFsIiwyNV0=",
                hasPreviousPage: false,
                startCursor: 'WyJuYXR1cmFsIiwxXQ=='
            },
            edges: [
                {
                    node: {
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
                                name: 'Artisan incroyable',
                                imageByAvatarImageId: {
                                    publicId: ''
                                }
                            }
                        }
                    }, 
                    cursor: 'jlkjm'
                },
                {             
                    node: {
                        id: 2,
                        text: 'message 2',
                        created: new Date(),
                        received: null,
                        imageByImageId: {
                            publicId: ''
                        },
                        participantByParticipantId: {
                            accountByAccountId: {
                                id: 1,
                                name: 'Artisan incroyable',
                                imageByAvatarImageId: {
                                    publicId: ''
                                }
                            }
                        }
                    },
                    cursor: 'jlkjm'  
                },
            ]
        },
          accountById: {
            id: otherAccountId,
            name: otherAccountDeleted ? '' : 'Mon association trop bien'
          },
          resourceById: {
                accountByAccountId: {
                    email: 'other@other.com',
                    id: 2,
                    name: otherAccountDeleted ? '' : 'Mon association trop bien',
                    imageByAvatarImageId: { publicId: '' }
                },
                canBeDelivered: true,
                canBeExchanged: true,
                canBeGifted: true,
                canBeTakenAway: true,
                description: 'description de ressource',
                id: resourceId,
                isProduct: true,
                isService: true,
                expiration: null,
                title: 'Une super ressource',
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
                  otherAccountId: defaultOtherAccountId,
                  first: 25
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
                    otherAccountId: defaultOtherAccountId,
                    first: 25
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
                    otherAccountId: defaultOtherAccountId,
                    first: 25
                },
                result: makeConversationData(defaultResourceId, defaultOtherAccountId, true, false)
            }
        ])
    ]
}

