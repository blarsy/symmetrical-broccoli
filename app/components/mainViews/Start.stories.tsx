import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import { apolloClientMocksDecorator, appContextDecorator, configDayjsDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import { GET_MINIMUM_CLIENT_VERSION, StartApolloWrapped } from './Start'
import { GET_CATEGORIES } from './Main'
import { SUGGESTED_RESOURCES } from '../SearchFilterContextProvider'
import { ISecureStore } from '@/lib/secureStore'
import { GET_SESSION_DATA } from '@/lib/useUserConnectionFunctions'
import { createMockClient } from 'mock-apollo-client'

const meta: Meta<typeof StartApolloWrapped> = {
  component: StartApolloWrapped,
  decorators: [
    paperProviderDecorator,
    (Story) => appContextDecorator(Story, true),
    configDayjsDecorator,
    apolloClientMocksDecorator([])
  ]
}

const simpleStartApolloQueries = [{
    query: GET_CATEGORIES,
    variables: { locale: 'fr'},
    result: {
        allResourceCategories: {
            nodes: [
                { code: 'cat1', name: 'Catégorie 1'},
                { code: 'cat2', name: 'Catégorie 2'},
            ]
        }
    }
}, {
    query: GET_MINIMUM_CLIENT_VERSION,
    variables: {},
    result: {
        getMinimumClientVersion: '0.0.4'
    }
}, {
    query: SUGGESTED_RESOURCES,
    variables: {
        searchTerm: '',
        canBeDelivered: false,
        canBeExchanged: false,
        canBeGifted: false,
        canBeTakenAway: false,
        isProduct: false,
        isService: false,
        categoryCodes: []
    },
    result: {
        suggestedResources: {
            nodes: [{
                accountByAccountId: {
                    name: 'Super artisan',
                    id: 1
                },
                created: new Date(),
                description: 'Description de la super ressource',
                title: 'Super ressource',
                canBeExchanged: true,
                canBeGifted: true,
                resourcesImagesByResourceId: {
                    nodes: [{
                        imageByImageId: { publicId: ''}
                    }]
                },
                expiration: new Date(new Date().valueOf() + 24 * 60 * 60 * 1000),
                isProduct: true,
                isService: true,
                id: 1,
                canBeTakenAway: true,
                canBeDelivered: true,
                resourcesResourceCategoriesByResourceId: {
                    nodes: [{
                        resourceCategoryCode: 'cat1'
                    }]
                }
            }]
        }
    }
}]

export default meta

type Story = StoryObj<typeof StartApolloWrapped>

export const Initial: Story = {
  name: 'Initial screen',
  decorators: [
    apolloClientMocksDecorator(simpleStartApolloQueries)
  ],
  args: {
    overrideVersionChecker: (serverVersion) => true
  }
}

export const Outdated: Story = {
    name: 'Client outdated',
    decorators: [
      apolloClientMocksDecorator(simpleStartApolloQueries)
    ],
    args: {
      overrideVersionChecker: (serverVersion) => false
    }
  }

  export const RestoreSession: Story = {
    name: 'Restores session',
    decorators: [
      apolloClientMocksDecorator(simpleStartApolloQueries)
    ],
    args: {
      overrideSecureStore: {
        get: (key: string) => Promise.resolve('usertoken'),
        set: async(key: string, value: string) => {},
        remove: async () => {}
      } as ISecureStore,
      clientGetter: token => {
        const client = createMockClient()
        client.setRequestHandler(GET_SESSION_DATA, () => Promise.resolve({ data:{
          getSessionData: {
              accountId: 1,
              email: 'me@me.com',
              name: 'Super artisan',
              avatarPublicId: '',
              activated: new Date(),
              logLevel: 2
          }
        }}))
        return client
      }
    }
  }