import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import { apolloClientMocksDecorator, appContextDecorator, configDayjsDecorator, paperProviderDecorator, statusBarCompensatorDecorator } from '@/lib/storiesUtil'
import { GET_MINIMUM_CLIENT_VERSION, StartApolloWrapped } from './Start'
import MainNavigator, { GET_CATEGORIES } from './MainNavigator'
import { ISecureStore } from '@/lib/secureStore'
import { GET_SESSION_DATA } from '@/lib/useUserConnectionFunctions'
import { createMockClient } from 'mock-apollo-client'
import queryMocks from '@/lib/queryMocks'

const meta: Meta<typeof StartApolloWrapped> = {
  component: StartApolloWrapped,
  decorators: [
    paperProviderDecorator,
    statusBarCompensatorDecorator,
    appContextDecorator(true),
    configDayjsDecorator
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
}, queryMocks.searchResultWithoutLocation]

export default meta

type Story = StoryObj<typeof StartApolloWrapped>

export const Initial: Story = {
  name: 'Initial screen',
  decorators: [
    apolloClientMocksDecorator(simpleStartApolloQueries)
  ],
  args: {
    overrideVersionChecker: () => true,
    splashScreenMinimumDuration: 1000,
    children: <MainNavigator />
  }
}

export const Outdated: Story = {
    name: 'Client outdated',
    decorators: [
      apolloClientMocksDecorator(simpleStartApolloQueries)
    ],
    args: {
      overrideVersionChecker: () => false,
      splashScreenMinimumDuration: 1000,
      children: <MainNavigator />
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
              logLevel: 2,
              unreadNotifications: [1, 2],
              unreadConversations: [1, 2],
              amountOfTokens: 0
          }
        }}))
        return client
      },
      splashScreenMinimumDuration: 1000,
      children: <MainNavigator />
    }
  }