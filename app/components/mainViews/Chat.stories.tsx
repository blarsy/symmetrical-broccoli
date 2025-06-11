import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import Chat from './Chat';
import { apolloClientMocksDecorator, appContextDecorator, gestureHandlerDecorator, navigationContainerDecorator, paperProviderDecorator } from '@/lib/storiesUtil';
import { CONVERSATION_MESSAGES } from '../chat/ConversationContextProvider';
import { SET_PARTICIPANT_READ } from '../chat/Conversation';

let msgCounter = 1
const makeConversationData = (resourceId: number, otherAccountId: number, resourceDeleted: boolean, otherAccountDeleted: boolean, endOfMessages : boolean = false) => (
    {
        conversationMessages: {
            pageInfo: {
                hasNextPage: true,
                endCursor: !endOfMessages && "WyJuYXR1cmFsIiwyNV0=",
                hasPreviousPage: false,
                startCursor: 'WyJuYXR1cmFsIiwxXQ=='
            },
            edges: [
                {
                    node: {
                        id: ++msgCounter,
                        text: `message ${msgCounter}`,
                        created: new Date(new Date().valueOf() - msgCounter * 1000 * 60 * 60 * 24),
                        received: null,
                        imageByImageId: {
                            publicId: ''
                        },
                        participantByParticipantId: {
                            id: 1,
                            accountByAccountId: {
                                id: 1,
                                name: 'Artisan incroyable',
                                imageByAvatarImageId: {
                                    publicId: ''
                                }
                            },
                            conversationByConversationId: {
                                id: 1
                            }
                        }
                    }, 
                    cursor: 'jlkjm'
                },
                {
                    node: {
                        id: ++msgCounter,
                        text: `message ${msgCounter}`,
                        created: new Date(new Date().valueOf() - msgCounter * 1000 * 60 * 60 * 24),
                        received: null,
                        imageByImageId: {
                            publicId: ''
                        },
                        participantByParticipantId: {
                            id: 2,
                            accountByAccountId: {
                                id: 1,
                                name: 'Artisan incroyable',
                                imageByAvatarImageId: {
                                    publicId: ''
                                }
                            },
                            conversationByConversationId: {
                                id: 2
                            }
                        }
                    }, 
                    cursor: 'jlkjm'
                },
                {             
                    node: {
                        id: msgCounter + 10,
                        text: `Message très très très très très très très très très très très très très très très très très très très très très long ${msgCounter}`,
                        created: new Date(new Date().valueOf() - msgCounter * 1000 * 60 * 60 * 24),
                        received: null,
                        imageByImageId: {
                            publicId: ''
                        },
                        participantByParticipantId: {
                            id: 3,
                            accountByAccountId: {
                                id: 1,
                                name: 'Artisan incroyable',
                                imageByAvatarImageId: {
                                    publicId: ''
                                }
                            },
                            conversationByConversationId: {
                                id: 3
                            }
                        }
                    },
                    cursor: 'jlkjm'  
                },
                {             
                    node: {
                        id: ++msgCounter,
                        text: `Réponse très très très très très très très très très très très très très très très très très très très très très longue ${msgCounter}`,
                        created: new Date(new Date().valueOf() - msgCounter * 1000 * 60 * 60 * 24),
                        received: null,
                        imageByImageId: {
                            publicId: ''
                        },
                        participantByParticipantId: {
                            id: 3,
                            accountByAccountId: {
                                id: otherAccountId,
                                name: 'Nouveau pote potentiel',
                                imageByAvatarImageId: {
                                    publicId: ''
                                }
                            },
                            conversationByConversationId: {
                                id: 3
                            }
                        }
                    },
                    cursor: 'jlkjm'  
                },
            ]
        },
        accountById: {
            id: otherAccountId,
            name: otherAccountDeleted ? '' : 'Mon association trop bien',
            imageByAvatarImageId: { publicId: '' }
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
            paidUntil: null,
            suspended: null,
            deleted: resourceDeleted ? new Date() : null
        }
    })
    
const defaultResourceId = 1
const defaultOtherAccountId = 2

const meta: Meta<typeof Chat> = {
  component: Chat,
  decorators: [
    paperProviderDecorator,
    appContextDecorator(),
    gestureHandlerDecorator,
    navigationContainerDecorator({ routes: [
        { name: 'conversation', params: { resourceId: 1, otherAccountId: 2 } }
    ], index: 0 })
  ]
}

export default meta
type Story = StoryObj<typeof Chat>

const argsForSingleConversationViews = {
    route: {
        name: '', 
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
          },
          {
            query: CONVERSATION_MESSAGES,
            variables: {
                resourceId: defaultResourceId,
                otherAccountId: defaultOtherAccountId,
                after: 'WyJuYXR1cmFsIiwyNV0=',
                first: 25
            },
            result: makeConversationData(defaultResourceId, defaultOtherAccountId, false, false, true)
        },{
            query: SET_PARTICIPANT_READ,
            variables: { resourceId: defaultResourceId, otherAccountId: defaultOtherAccountId },
            result: {
                setParticipantRead: { integer: 1 }
            }
        }, {
            query: SET_PARTICIPANT_READ,
            variables: { resourceId: defaultResourceId, otherAccountId: defaultOtherAccountId },
            result: {
                setParticipantRead: { integer: 1 }
            }
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
            },
            { 
                query: CONVERSATION_MESSAGES,
                variables: {
                    resourceId: defaultResourceId,
                    otherAccountId: defaultOtherAccountId,
                    first: 25
                },
                result: makeConversationData(defaultResourceId, defaultOtherAccountId, false, true)
            },{
                query: SET_PARTICIPANT_READ,
                variables: { resourceId: defaultResourceId, otherAccountId: defaultOtherAccountId },
                result: {
                    setParticipantRead: { integer: 1 }
                }
            }, {
                query: SET_PARTICIPANT_READ,
                variables: { resourceId: defaultResourceId, otherAccountId: defaultOtherAccountId },
                result: {
                    setParticipantRead: { integer: 1 }
                }
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
            }, {
                query: SET_PARTICIPANT_READ,
                variables: { resourceId: defaultResourceId, otherAccountId: defaultOtherAccountId },
                result: {
                    setParticipantRead: { integer: 1 }
                }
            }
        ])
    ]
}

