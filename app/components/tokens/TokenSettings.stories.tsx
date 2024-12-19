import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import { paperProviderDecorator, gestureHandlerDecorator, navigationContainerDecorator, apolloClientMocksDecorator, appContextDecorator } from '@/lib/storiesUtil'
import TokenSettings from './TokenSettings'
import { GET_RESOURCES_WITHOUT_PIC } from './InfoHowToGet'
import { GraphQlLib } from '@/lib/backendFacade'
import { GET_TOKENS_HISTORY } from './History'

const meta: Meta<typeof TokenSettings> = {
  component: TokenSettings,
  decorators: [
    paperProviderDecorator, gestureHandlerDecorator, navigationContainerDecorator(), appContextDecorator(false, false), apolloClientMocksDecorator([{
      query: GET_RESOURCES_WITHOUT_PIC,
      result: {
        getMyResourcesWithoutPicture: {
          nodes: [{ id: 1 }, { id: 2 }]
        }
      }
    }, {
      query: GraphQlLib.queries.GET_ACCOUNT,
      variables: {
        id: 1
      },
      result: {
          accountById: {
              id: 1,
              email: 'me@me.com',
              name: 'Artisan trop super',
              resourcesByAccountId: {
                  nodes: []
              },
              imageByAvatarImageId: {
                  publicId: 'occysgyx6m8kk5y51myu'
              },
              accountsLinksByAccountId: {
                  nodes: []
              },
              locationByLocationId: null
          }
      }
    }, {
      query: GET_TOKENS_HISTORY,
      variables: { first: 5 },
      result: {
        getTokensHistory: {
          edges: [{
            node: { id: 123, created: new Date(new Date().valueOf() - 1000 * 60 * 60 * 24), movement: 12, tokenTransactionTypeByTokenTransactionTypeId: { id: 3, code: '' } },
            cursor: 'cur1'
          }, {
            node: { id: 124, created: new Date(new Date().valueOf() - 1000 * 60 * 60 * 24 * 2), movement: -2, tokenTransactionTypeByTokenTransactionTypeId: { id: 1, code: '' } },
            cursor: 'cur1'
          }, {
            node: { id: 125, created: new Date(new Date().valueOf() - 1000 * 60 * 60 * 24 * 3), movement: 4, tokenTransactionTypeByTokenTransactionTypeId: { id: 4, code: '' } },
            cursor: 'cur1'
          }, {
            node: { id: 126, created: new Date(new Date().valueOf() - 1000 * 60 * 60 * 24 * 4), movement: 7, tokenTransactionTypeByTokenTransactionTypeId: { id: 6, code: '' } },
            cursor: 'cur1'
          }, {
            node: { id: 127, created: new Date(new Date().valueOf() - 1000 * 60 * 60 * 24 * 5), movement: -4, tokenTransactionTypeByTokenTransactionTypeId: { id: 2, code: '' } },
            cursor: 'cur1'
          }],
          pageInfo: {
            hasNextPage: true,
            endCursor: 'cur1'
          }
        }
      }
    }, {
      query: GET_TOKENS_HISTORY,
      variables: { first: 5, after: 'cur1' },
      result: {
        getTokensHistory: {
          edges: [{
            node: { id: 133, created: new Date(new Date().valueOf() - 1000 * 60 * 60 * 24 * 2), movement: 12, tokenTransactionTypeByTokenTransactionTypeId: { id: 3, code: '' } },
            cursor: 'cur1'
          }, {
            node: { id: 134, created: new Date(new Date().valueOf() - 1000 * 60 * 60 * 24 * 3), movement: -2, tokenTransactionTypeByTokenTransactionTypeId: { id: 1, code: '' } },
            cursor: 'cur1'
          }, {
            node: { id: 135, created: new Date(new Date().valueOf() - 1000 * 60 * 60 * 24 * 4), movement: 4, tokenTransactionTypeByTokenTransactionTypeId: { id: 4, code: '' } },
            cursor: 'cur1'
          }, {
            node: { id: 136, created: new Date(new Date().valueOf() - 1000 * 60 * 60 * 24 * 5), movement: 7, tokenTransactionTypeByTokenTransactionTypeId: { id: 6, code: '' } },
            cursor: 'cur1'
          }],
          pageInfo: {
            hasNextPage: false,
            endCursor: 'cur2'
          }
        }
      }
    }])
  ]
}

export default meta
type Story = StoryObj<typeof TokenSettings>

export const Common: Story = {
    name: 'Common token settings'
}