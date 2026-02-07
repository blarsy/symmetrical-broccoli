import type { Meta, StoryObj } from '@storybook/react';

import React  from 'react'
import { apolloClientMocksDecorator, appContextDecorator, gestureHandlerDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import SentBids, { GET_MY_BIDS } from './SentBids'
import { daysFromNow } from '@/lib/utils'

const meta: Meta<typeof SentBids> = {
  component: SentBids,
  decorators: [
    paperProviderDecorator, appContextDecorator(), gestureHandlerDecorator, apolloClientMocksDecorator([
        { query: GET_MY_BIDS, variables: { first: 10 }, result: {
            myBids: { 
                edges: [{ 
                    cursor: '',
                    node: {
                        id: 1,
                        accepted: null,
                        amountOfTokens: 500,
                        created: daysFromNow(-1),
                        deleted: null,
                        refused: null,
                        validUntil: daysFromNow(10),
                        resourceByResourceId: {
                            accountsPublicDatumByAccountId: {
                                id: 12,
                                imageByAvatarImageId: {
                                    publicId: 'pwb8arnohwpjahnebyxj'
                                },
                                name: 'super artisan'
                            },
                            title: 'resource title',
                            price: 100,
                            expiration: null,
                            resourcesImagesByResourceId: {
                                nodes: [{
                                    imageByImageId: {
                                        publicId: 'he265cbgcsaqegbdsxy8'
                                    }
                                }]
                            },
                            id: 21,
                            campaignsResourcesByResourceId: {
                                nodes:[]
                            }
                        },
                        accountsPublicDatumByAccountId: {
                            id: 32,
                            imageByAvatarImageId: {
                                publicId: 'jqmyhsmx1led7nhvilp3'
                            },
                            name: 'Offrant'
                        }
                    }
                }, { 
                    cursor: '',
                    node: {
                        id: 9,
                        accepted: new Date(),
                        amountOfTokens: 400,
                        created: daysFromNow(-1),
                        deleted: null,
                        refused: null,
                        validUntil: daysFromNow(10),
                        resourceByResourceId: {
                            accountsPublicDatumByAccountId: {
                                id: 12,
                                imageByAvatarImageId: {
                                    publicId: 'pwb8arnohwpjahnebyxj'
                                },
                                name: 'super long name super long nam'
                            },
                            title: 'resource title very super long name',
                            price: 200,
                            expiration: null,
                            resourcesImagesByResourceId: {
                                nodes: [{
                                    imageByImageId: {
                                        publicId: 'he265cbgcsaqegbdsxy8'
                                    }
                                }]
                            },
                            id: 21,
                            campaignsResourcesByResourceId: {
                                nodes:[]
                            }
                        },
                        accountsPublicDatumByAccountId: {
                            id: 32,
                            imageByAvatarImageId: {
                                publicId: 'jqmyhsmx1led7nhvilp3'
                            },
                            name: 'Offrant'
                        }
                    }
                }, { 
                    cursor: '',
                    node: {
                        id: 5,
                        accepted: null,
                        amountOfTokens: 300,
                        created: daysFromNow(-1),
                        deleted: null,
                        refused: new Date(),
                        validUntil: daysFromNow(10),
                        resourceByResourceId: {
                            accountsPublicDatumByAccountId: {
                                id: 12,
                                imageByAvatarImageId: {
                                    publicId: 'pwb8arnohwpjahnebyxj'
                                },
                                name: 'super long name super long nam'
                            },
                            title: 'resource title very super long name',
                            price: 300,
                            expiration: null,
                            resourcesImagesByResourceId: {
                                nodes: [{
                                    imageByImageId: {
                                        publicId: 'he265cbgcsaqegbdsxy8'
                                    }
                                }]
                            },
                            id: 21,
                            campaignsResourcesByResourceId: {
                                nodes:[]
                            }
                        },
                        accountsPublicDatumByAccountId: {
                            id: 32,
                            imageByAvatarImageId: {
                                publicId: 'jqmyhsmx1led7nhvilp3'
                            },
                            name: 'Offrant'
                        }
                    }
                }, { 
                    cursor: '',
                    node: {
                        id: 3,
                        accepted: null,
                        amountOfTokens: 300,
                        created: daysFromNow(-1),
                        deleted: new Date(),
                        refused: null,
                        validUntil: daysFromNow(10),
                        resourceByResourceId: {
                            accountsPublicDatumByAccountId: {
                                id: 12,
                                imageByAvatarImageId: {
                                    publicId: 'pwb8arnohwpjahnebyxj'
                                },
                                name: 'Good friend'
                            },
                            title: 'Neat resource',
                            price: 300,
                            expiration: null,
                            resourcesImagesByResourceId: {
                                nodes: [{
                                    imageByImageId: {
                                        publicId: 'he265cbgcsaqegbdsxy8'
                                    }
                                }]
                            },
                            id: 21,
                            campaignsResourcesByResourceId: {
                                nodes:[]
                            }
                        },
                        accountsPublicDatumByAccountId: {
                            id: 32,
                            imageByAvatarImageId: {
                                publicId: 'jqmyhsmx1led7nhvilp3'
                            },
                            name: 'Offrant'
                        }
                    }
                }, { 
                    cursor: '',
                    node: {
                        id: 8,
                        accepted: null,
                        amountOfTokens: 235,
                        created: daysFromNow(-1),
                        deleted: null,
                        refused: null,
                        validUntil: daysFromNow(10),
                        resourceByResourceId: {
                            accountsPublicDatumByAccountId: {
                                id: 12,
                                imageByAvatarImageId: {
                                    publicId: 'pwb8arnohwpjahnebyxj'
                                },
                                name: 'Good friend'
                            },
                            title: 'Neat resource',
                            price: null,
                            expiration: null,
                            resourcesImagesByResourceId: {
                                nodes: [{
                                    imageByImageId: {
                                        publicId: 'he265cbgcsaqegbdsxy8'
                                    }
                                }]
                            },
                            id: 21,
                            campaignsResourcesByResourceId: {
                                nodes:[]
                            }
                        },
                        accountsPublicDatumByAccountId: {
                            id: 32,
                            imageByAvatarImageId: {
                                publicId: 'jqmyhsmx1led7nhvilp3'
                            },
                            name: 'Offrant'
                        }
                    }
                }],
                pageInfo: {
                    endCursor: '',
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: ''
                }
            }
        } }
    ])
  ]
}

export default meta
type Story = StoryObj<typeof SentBids>

export const Simple: Story = {
    name: 'Simple view',
    args: {}
}