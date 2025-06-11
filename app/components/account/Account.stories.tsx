import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import { apolloClientMocksDecorator, gestureHandlerDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import Account from './Account'
import { GraphQlLib } from '@/lib/backendFacade'

const accountId = 1

const makeGetAccountOp = (noLinks: boolean = false, noResource: boolean = false, noLogo: boolean = false, withAddress: boolean = true, longContent: boolean = false) => {
    let links = [] as any[]

    if(!noLinks) {
        links = [{
            id: 1,
            url: 'http://blablabla',
            label: '',
            linkTypeByLinkTypeId: {
                id: 4
            }
        },{
            id: 2,
            url: 'http://facebook.com/toptop',
            label: 'Mon Facebook Toptop',
            linkTypeByLinkTypeId: {
                id: 1
            }
        },{
            id: 3,
            url: 'http://coucou.be',
            label: 'Très long texte de lien 0987654',
            linkTypeByLinkTypeId: {
                id: 3
            }
        },{
            id: 4,
            url: 'http://ma-trestres-longueadresse.internet.com/0987654321065432109876543210987654321',
            label: '',
            linkTypeByLinkTypeId: {
                id: 2
            }
        }]
    }

    let resources = [] as any[]

    if(!noResource) {
        resources = [
            {
                id: 1,
                canBeExchanged: true,
                canBeGifted: false,
                title: 'Ressource 1',
                expiration: new Date(new Date().valueOf() + 1000 * 60 * 60 * 24),
                resourcesImagesByResourceId: {
                    nodes: [{
                        imageByImageId: {
                            publicId: 'pwb8arnohwpjahnebyxj'
                        }
                    }]
                },
                resourcesResourceCategoriesByResourceId: {
                    nodes: [{
                        resourceCategoryCode: 'cat1'
                    }]
                },
                accountByAccountId: {
                    id: accountId
                },
                deleted: null,
                paidUntil: new Date()
            }, {
                id: 2,
                canBeExchanged: false,
                canBeGifted: true,
                title: 'Ressource 2',
                expiration: new Date(new Date().valueOf() + 1000 * 60 * 60 * 24),
                resourcesImagesByResourceId: {
                    nodes: [{
                        imageByImageId: {
                            publicId: ''
                        }
                    }]
                },
                resourcesResourceCategoriesByResourceId: {
                    nodes: []
                },
                accountByAccountId: {
                    id: accountId
                },
                deleted: null,
                paidUntil: new Date()
            }, {
                id: 3,
                canBeExchanged: true,
                canBeGifted: true,
                title: 'Ressource 3',
                expiration: new Date(new Date().valueOf() + 1000 * 60 * 60 * 24),
                resourcesImagesByResourceId: {
                    nodes: [{
                        imageByImageId: {
                            publicId: ''
                        }
                    }]
                },
                resourcesResourceCategoriesByResourceId: {
                    nodes: []
                },
                accountByAccountId: {
                    id: accountId
                },
                deleted: null,
                paidUntil: new Date()
            }, {
                id: 4,
                canBeExchanged: true,
                canBeGifted: true,
                title: 'Ressource 4',
                expiration: new Date(new Date().valueOf() + 1000 * 60 * 60 * 24),
                resourcesImagesByResourceId: {
                    nodes: [{
                        imageByImageId: {
                            publicId: ''
                        }
                    }]
                },
                resourcesResourceCategoriesByResourceId: {
                    nodes: []
                },
                accountByAccountId: {
                    id: accountId
                },
                deleted: null,
                paidUntil: new Date()
            }, {
                id: 5,
                canBeExchanged: true,
                canBeGifted: true,
                title: 'Ressource 5',
                expiration: new Date(new Date().valueOf() + 1000 * 60 * 60 * 24),
                resourcesImagesByResourceId: {
                    nodes: [{
                        imageByImageId: {
                            publicId: 'pwb8arnohwpjahnebyxj'
                        }
                    }]
                },
                resourcesResourceCategoriesByResourceId: {
                    nodes: []
                },
                accountByAccountId: {
                    id: accountId
                },
                deleted: null,
                paidUntil: new Date()
            }, {
                id: 6,
                canBeExchanged: true,
                canBeGifted: true,
                title: 'Ressource 6',
                expiration: new Date(new Date().valueOf() + 1000 * 60 * 60 * 24),
                resourcesImagesByResourceId: {
                    nodes: [{
                        imageByImageId: {
                            publicId: ''
                        }
                    }]
                },
                resourcesResourceCategoriesByResourceId: {
                    nodes: []
                },
                accountByAccountId: {
                    id: accountId
                },
                deleted: null,
                paidUntil: new Date()
            }
        ]
    }

    return {
        query: GraphQlLib.queries.GET_ACCOUNT,
        variables: {
            id: accountId
        },
        result: {
            accountById: {
                id: 2,
                email: 'me@me.com',
                name: longContent ? 'Artisan trop super mais alors!' : 'Artisan trop super',
                resourcesByAccountId: {
                    nodes: resources
                },
                imageByAvatarImageId: {
                    publicId: noLogo ? '' : 'occysgyx6m8kk5y51myu'
                },
                accountsLinksByAccountId: {
                    nodes: links
                },
                locationByLocationId: withAddress ? {
                    address: 'Rue Tripoli, 3',
                    id: 2,
                    longitude: 5,
                    latitude: 48
                } : null
            }
        }
    }
}

const meta: Meta<typeof Account> = {
  component: Account,
  decorators: [
    paperProviderDecorator, gestureHandlerDecorator
  ]
}

export default meta
type Story = StoryObj<typeof Account>

export const Simple: Story = {
    name: 'Simple Account view',
    decorators: [apolloClientMocksDecorator([makeGetAccountOp()])],
    args: { id: 1 }
}

export const NoLinksNoResourceNoLogo: Story = {
    name: 'Minimum data account view',
    decorators: [apolloClientMocksDecorator([makeGetAccountOp(true, true, true, false)])],
    args: { id: 1 },
}

export const WithLongContent: Story = {
    decorators: [apolloClientMocksDecorator([makeGetAccountOp(false, false, false, true, true)])],
    args: { id: 1 } 
}