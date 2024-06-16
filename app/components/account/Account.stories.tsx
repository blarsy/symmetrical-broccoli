import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import { apolloClientMocksDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import Account, { GET_ACCOUNT } from './Account'

const accountId = 1
const meta: Meta<typeof Account> = {
  component: Account,
  decorators: [
    paperProviderDecorator, apolloClientMocksDecorator([{
        query: GET_ACCOUNT,
        variables: {
            id: accountId
        },
        result: {
            accountById: {
                email: 'me@me.com',
                name: 'Artisan trop super',
                resourcesByAccountId: {
                    nodes: [
                        {
                            canBeExchanged: true,
                            canBeGifted: false,
                            title: 'Ressource 1',
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
                            }
                        }, {
                            canBeExchanged: false,
                            canBeGifted: true,
                            title: 'Ressource 2',
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
                            }
                        }, {
                            canBeExchanged: true,
                            canBeGifted: true,
                            title: 'Ressource 3',
                            resourcesImagesByResourceId: {
                                nodes: [{
                                    imageByImageId: {
                                        publicId: ''
                                    }
                                }]
                            },
                            resourcesResourceCategoriesByResourceId: {
                                nodes: []
                            }
                        }, {
                            canBeExchanged: true,
                            canBeGifted: true,
                            title: 'Ressource 4',
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
                            }
                        }, {
                            canBeExchanged: true,
                            canBeGifted: true,
                            title: 'Ressource 5',
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
                            }
                        }, {
                            canBeExchanged: true,
                            canBeGifted: true,
                            title: 'Ressource 6',
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
                            }
                        }
                    ]
                },
                imageByAvatarImageId: {
                    publicId: 'occysgyx6m8kk5y51myu'
                }
            }
        }
    }])
  ]
}

export default meta
type Story = StoryObj<typeof Account>

export const Simple: Story = {
    name: 'Simple Account view',
    args: { id: 1 }
}