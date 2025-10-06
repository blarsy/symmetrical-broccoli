import type { Meta, StoryObj } from '@storybook/react'
import { apolloClientMocksDecorator, clientComponentDecorator, defaultCampaign } from '@/lib/storiesUtil'
import EarningTokens, { GET_ACCOUNT, GET_RESOURCES_WITHOUT_PIC, NUMBER_ACTIVE_RESOURCES_ON_ACTIVE_CAMPAIGN } from './EarningTokens'
import { GET_ACTIVE_CAMPAIGN } from '@/lib/useActiveCampaign'

const meta = {
  component: EarningTokens,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {  },
  decorators: []
} satisfies Meta<typeof EarningTokens>

export default meta
type Story = StoryObj<typeof meta>

export const NoCampaignVanillaAccount: Story = {
  args: { version: 'V0_10' },
  decorators: [apolloClientMocksDecorator([{
    query: GET_ACTIVE_CAMPAIGN, result: { getActiveCampaign: null }, variables: {}
  }, {
    query: NUMBER_ACTIVE_RESOURCES_ON_ACTIVE_CAMPAIGN, result: { getNumberOfActiveResourcesOnActiveCampaign: 0 }, variables: {}
  }, {
    query: GET_ACCOUNT, result: { me: {
        email: 'me@me.com',
        name: 'Super artisan',
        id: 321,
        resourcesByAccountId: { nodes: [{
            id: 123,
            canBeGifted: true,
            canBeExchanged: true,
            title: 'Bonbon en sucre 4kg',
            deleted: null,
            expiration: null,
            suspended: null,
            paidUntil: null,
            resourcesImagesByResourceId: {
                nodes: []},
            resourcesResourceCategoriesByResourceId: {
            nodes: [{
                resourceCategoryCode: '1'
            }]
            },
            accountByAccountId: {
                id: 123
            }
        }]},
        imageByAvatarImageId: null,
        accountsLinksByAccountId: {
            nodes: []
        },
        locationByLocationId : null
    } }, variables: {}
  }, {
    query: GET_RESOURCES_WITHOUT_PIC, result: {getMyResourcesWithoutPicture: null}, variables: {}
  }]), clientComponentDecorator()]
}
export const NoCampaignAccountFilled: Story = {
  args: { version: 'V0_10' },
  decorators: [apolloClientMocksDecorator([{
    query: GET_ACTIVE_CAMPAIGN, result: { getActiveCampaign: null }, variables: {}
  }, {
    query: NUMBER_ACTIVE_RESOURCES_ON_ACTIVE_CAMPAIGN, result: { getNumberOfActiveResourcesOnActiveCampaign: 0 }, variables: {}
  }, {
    query: GET_ACCOUNT, result: { me: {
        email: 'me@me.com',
        name: 'Super artisan',
        id: 321,
        resourcesByAccountId: { nodes: [{
            id: 123,
            canBeGifted: true,
            canBeExchanged: true,
            title: 'Bonbon en sucre 4kg',
            deleted: null,
            expiration: null,
            suspended: null,
            paidUntil: null,
            resourcesImagesByResourceId: {
                nodes: [
                    {
                    imageByImageId: {
                        publicId: 'jyg9bnk5b8oyvp4trhvp'
                    }
                }
            ]},
            resourcesResourceCategoriesByResourceId: {
            nodes: [{
                resourceCategoryCode: '1'
            }]
            },
            accountByAccountId: {
                id: 123
            }
        }]},
        imageByAvatarImageId: null,
        accountsLinksByAccountId: {
            nodes: [{
                id: 1,
                url: 'http://la.bas',
                label: 'blog',
                linkTypeByLinkTypeId: {
                    id: 1
                }
            }]
        },
        locationByLocationId : 
        {
            address: 'Rue du plouf, 321',
            id: 1,
            longitude: 1.00,
            latitude: 50.00
        } 
    } }, variables: {}
  }, {
    query: GET_RESOURCES_WITHOUT_PIC, result: {getMyResourcesWithoutPicture: null}, variables: {}
  }]), clientComponentDecorator({ loading: false, subscriptions: [], token: 'fkqme', unreadNotifications: [], account: {
    activated: new Date(), amountOfTokens: 20, avatarPublicId: 'jyg9bnk5b8oyvp4trhvp', email: 'me@me.com', id: 234, knowsAboutCampaigns: true, willingToContribute: true, name: 'name', unlimitedUntil: null, lastChangeTimestamp: new Date()
  } })]
}
export const NoCampaignAccountFilled1ResourceWithoutPic: Story = {
  args: { version: 'V0_10' },
  decorators: [apolloClientMocksDecorator([{
    query: GET_ACTIVE_CAMPAIGN, result: { getActiveCampaign: null }, variables: {}
  }, {
    query: NUMBER_ACTIVE_RESOURCES_ON_ACTIVE_CAMPAIGN, result: { getNumberOfActiveResourcesOnActiveCampaign: 0 }, variables: {}
  }, {
    query: GET_ACCOUNT, result: { me: {
        email: 'me@me.com',
        name: 'Super artisan',
        id: 321,
        resourcesByAccountId: { nodes: [{
            id: 123,
            canBeGifted: true,
            canBeExchanged: true,
            title: 'Bonbon en sucre 4kg',
            deleted: null,
            expiration: null,
            suspended: null,
            paidUntil: null,
            resourcesImagesByResourceId: {
                nodes: []},
            resourcesResourceCategoriesByResourceId: {
            nodes: [{
                resourceCategoryCode: '1'
            }]
            },
            accountByAccountId: {
                id: 123
            }
        }, {
            id: 234,
            canBeGifted: true,
            canBeExchanged: true,
            title: 'Lot de 10 palettes',
            deleted: null,
            expiration: null,
            suspended: null,
            paidUntil: null,
            resourcesImagesByResourceId: {
                nodes: []},
            resourcesResourceCategoriesByResourceId: {
            nodes: [{
                resourceCategoryCode: '1'
            }]
            },
            accountByAccountId: {
                id: 123
            }
        }]},
        imageByAvatarImageId: null,
        accountsLinksByAccountId: {
            nodes: [{
                id: 1,
                url: 'http://la.bas',
                label: 'blog',
                linkTypeByLinkTypeId: {
                    id: 1
                }
            }]
        },
        locationByLocationId : 
        {
            address: 'Rue du plouf, 321',
            id: 1,
            longitude: 1.00,
            latitude: 50.00
        } 
    } }, variables: {}
  }, {
    query: GET_RESOURCES_WITHOUT_PIC, result: {getMyResourcesWithoutPicture: { nodes: [{ id: 5 }] }}, variables: {}
  }]), clientComponentDecorator({ loading: false, subscriptions: [], token: 'fkqme', unreadNotifications: [], account: {
    activated: new Date(), amountOfTokens: 20, avatarPublicId: 'jyg9bnk5b8oyvp4trhvp', email: 'me@me.com', id: 234, knowsAboutCampaigns: true, willingToContribute: true, name: 'name', unlimitedUntil: null, lastChangeTimestamp: new Date()
  } })]
}
export const NoResourceInCampaign: Story = {
  args: { version: 'V0_10' },
  decorators: [apolloClientMocksDecorator([{
    query: GET_ACTIVE_CAMPAIGN, result: { getActiveCampaign: defaultCampaign }, variables: {}
  }, {
    query: NUMBER_ACTIVE_RESOURCES_ON_ACTIVE_CAMPAIGN, result: { getNumberOfActiveResourcesOnActiveCampaign: 0 }, variables: {}
  }, {
    query: GET_ACCOUNT, result: { me: {
        email: 'me@me.com',
        name: 'Super artisan',
        id: 321,
        resourcesByAccountId: { nodes: []},
        imageByAvatarImageId: null,
        accountsLinksByAccountId: {
            nodes: []
        },
        locationByLocationId : null
    } }, variables: {}
  }, {
    query: GET_RESOURCES_WITHOUT_PIC, result: {getMyResourcesWithoutPicture: { nodes: [] }}, variables: {}
  }]), clientComponentDecorator()]
}
export const EligibleToFutureAirdrop: Story = {
  args: { version: 'V0_10' },
  decorators: [apolloClientMocksDecorator([{
    query: GET_ACTIVE_CAMPAIGN, result: { getActiveCampaign: defaultCampaign }, variables: {}
  }, {
    query: NUMBER_ACTIVE_RESOURCES_ON_ACTIVE_CAMPAIGN, result: { getNumberOfActiveResourcesOnActiveCampaign: 2 }, variables: {}
  }, {
    query: GET_ACCOUNT, result: { me: {
        email: 'me@me.com',
        name: 'Super artisan',
        id: 321,
        resourcesByAccountId: { nodes: []},
        imageByAvatarImageId: null,
        accountsLinksByAccountId: {
            nodes: []
        },
        locationByLocationId : null
    } }, variables: {}
  }, {
    query: GET_RESOURCES_WITHOUT_PIC, result: {getMyResourcesWithoutPicture: { nodes: [] }}, variables: {}
  }]), clientComponentDecorator()]
}
export const AirdropDone: Story = {
  args: { version: 'V0_10' },
  decorators: [apolloClientMocksDecorator([{
    query: GET_ACTIVE_CAMPAIGN, result: { getActiveCampaign: { ...defaultCampaign, ...{ airdropDone: true, airdrop: new Date(new Date().valueOf() - 1000) }} }, variables: {}
  }, {
    query: NUMBER_ACTIVE_RESOURCES_ON_ACTIVE_CAMPAIGN, result: { getNumberOfActiveResourcesOnActiveCampaign: 2 }, variables: {}
  }, {
    query: GET_ACCOUNT, result: { me: {
        email: 'me@me.com',
        name: 'Super artisan',
        id: 321,
        resourcesByAccountId: { nodes: []},
        imageByAvatarImageId: null,
        accountsLinksByAccountId: {
            nodes: []
        },
        locationByLocationId : null
    } }, variables: {}
  }, {
    query: GET_RESOURCES_WITHOUT_PIC, result: {getMyResourcesWithoutPicture: { nodes: [] }}, variables: {}
  }]), clientComponentDecorator()]
}