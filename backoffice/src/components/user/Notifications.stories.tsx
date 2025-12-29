import type { Meta, StoryObj } from '@storybook/react'
import { apolloClientMocksDecorator, connectedComponent } from '@/lib/storiesUtil'
import Notifications, { GET_NOTIFICATIONS, GET_RESOURCES } from './Notifications'

const meta = {
  component: Notifications,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: { 
    version: 'v0_10'
   },
} satisfies Meta<typeof Notifications>

export default meta
type Story = StoryObj<typeof meta>

const yesterday = new Date(new Date().valueOf() - 1000 * 60 * 60 * 24)

export const Empty: Story = {
  args: {
  },
  decorators: [
    connectedComponent([{ query: GET_NOTIFICATIONS, variables: { first: 15 }, result: {
        myNotifications: {
        edges: [ ],
            pageInfo: {
                hasNextPage: false
            }
        }
    } }])
  ]
}

export const fewNotifications: Story = {
  args: {
  },
  decorators: [ connectedComponent([{ query: GET_NOTIFICATIONS, variables: { first: 15 }, result: {
        myNotifications: {
            edges: [ 
                {node: { id: 1, read: null, created: yesterday, data: { info: 'COMPLETE_PROFILE' } }}
            ],
            pageInfo: {
                hasNextPage: false,
                endCursor: ''
            }
        }
    } }])
  ]
}

export const OneNewResourceNotification: Story = {
  args: {
  },
  decorators: [ connectedComponent([
    { query: GET_RESOURCES, variables: { resourceIds: [123] }, result: {
        getResources: {
            nodes: [{
                accountByAccountId: {
                    email: 'e@mail.be',
                    id: 12,
                    name: 'Tonton plafond',
                    imageByAvatarImageId: {
                        publicId: 'ltnozwdpaqyazpkk0out'
                    }
                },
                canBeDelivered: false,
                canBeExchanged: true,
                canBeGifted: false,
                canBeTakenAway: true,
                description: 'description de la ressource',
                id: 123,
                isProduct: false,
                isService: true,
                expiration: null,
                title: 'Nouvelle ressource trop bien',
                resourcesResourceCategoriesByResourceId: {
                    nodes: [{
                        imageByImageId: {
                            publicId: 'llkg0c6dxq9wex4kz6bb'
                        }
                    }]
                },
                resourcesImagesByResourceId: {
                    nodes : [                        
                        { imageByImageId: {
                            publicId: 'llkg0c6dxq9wex4kz6bb'
                        }
                    }]
                },
                locationBySpecificLocationId: null,
                created: yesterday,
                deleted: null,
                price: 100
            }]
        }
    } },
    { query: GET_NOTIFICATIONS, variables: { first: 15 }, result: {
        myNotifications: {
            edges: [ 
                {node: { id: 20, read: null, created: yesterday, data: { resource_id: 123 } }},
            ],
            pageInfo: {
                hasNextPage: false,
                endCursor: ''
            }
        }
    } }])
  ]
}

export const EveryNotification: Story = {
  args: {
  },
  decorators: [ connectedComponent([
    { query: GET_RESOURCES, variables: { resourceIds: [123] }, result: {
        getResources: {
            nodes: [{
                accountByAccountId: {
                    email: 'e@mail.be',
                    id: 12,
                    name: 'Tonton plafond',
                    imageByAvatarImageId: {
                        publicId: 'ltnozwdpaqyazpkk0out'
                    }
                },
                canBeDelivered: false,
                canBeExchanged: true,
                canBeGifted: false,
                canBeTakenAway: true,
                description: 'description de la ressource',
                id: 123,
                isProduct: false,
                isService: true,
                expiration: null,
                title: 'Nouvelle ressource trop bien',
                resourcesResourceCategoriesByResourceId: {
                    nodes: [{}]
                },
                resourcesImagesByResourceId: {
                    nodes : [                       
                        { imageByImageId: {
                            publicId: 'llkg0c6dxq9wex4kz6bb'
                        }}
                    ]
                },
                locationBySpecificLocationId: null,
                created: yesterday,
                deleted: null,
                price: 100
            }]
        }
    } },
    { query: GET_NOTIFICATIONS, variables: { first: 15 }, result: {
        myNotifications: {
            edges: [ 
                {node: { id: 20, read: null, created: yesterday, data: { resource_id: 123 } }},
                {node: { id: 1, read: null, created: yesterday, data: { info: 'COMPLETE_PROFILE' } }},
                {node: { id: 4, read: null, created: yesterday, data: { info: 'TOKENS_RECEIVED', fromAccount: 'Colonel Moutarde', amountReceived: 100 } }},
                {node: { id: 5, read: null, created: yesterday, data: { info: 'TOKENS_SENT', toAccount: 'Madame Rose', amountSent: 200 } }},
                {node: { id: 6, read: null, created: yesterday, data: { info: 'WELCOME_TOKEN_USER' } }},
                {node: { id: 7, read: null, created: yesterday, data: { info: 'BID_RECEIVED', receivedFrom: 'Madame Rose', resourceTitle: 'Sac à dos ado' } }},
                {node: { id: 8, read: null, created: yesterday, data: { info: 'BID_REFUSED', refuser: 'Jaune Wayne', resourceTitle: 'Vélo ville' } }},
                {node: { id: 9, read: null, created: yesterday, data: { info: 'BID_ACCEPTED', accepter: 'Georges Rouge', resourceTitle: 'Légo tricot' } }},
                {node: { id: 10, read: null, created: yesterday, data: { info: 'BID_AUTO_DELETED_AFTER_RESOURCE_EXPIRED', resourceAuthor: 'Ina Orange', resourceTitle: 'Fronde à boule de ouate' } }},
                {node: { id: 11, read: null, created: yesterday, data: { info: 'BID_CANCELLED', cancelledBy: 'Georges Rouge', resourceTitle: 'Papier crépon' } }},
                {node: { id: 12, read: null, created: yesterday, data: { info: 'BID_EXPIRED', resourceAuthor: 'Romulus Rémus', resourceTitle: 'Statue béton' } }},
                {node: { id: 13, read: null, created: yesterday, data: { info: 'TOKEN_GRANTED', grantorName: 'Georges Rouge', amountOfTokens: 300 } }},
                {node: { id: 14, read: null, created: yesterday, data: { info: 'AIRDROP_RECEIVED', campaignName: 'Vive la rentrée', amountOfTokens: 'Légo tricot' } }},
                {node: { id: 15, read: null, created: yesterday, data: { info: 'CAMPAIGN_BEGUN', campaignName: 'Vive la rentrée', airdropAmount: 4000, multiplier: 10, airdrop: new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 10) } }},
                {node: { id: 16, read: null, created: yesterday, data: { info: 'AIRDROP_SOON', campaignName: 'Vive la rentrée', airdropAmount: 3000, airdrop: new Date(new Date().valueOf() + 1000 * 60 * 60 * 24) } }},
                {node: { id: 17, read: null, created: yesterday, data: { info: 'GRANT_RECEIVED', title: 'Bonus par QR code!', amount: 1234 } }},
            ],
            pageInfo: {
                hasNextPage: false,
                endCursor: ''
            }
        }
    } }])
  ]
}