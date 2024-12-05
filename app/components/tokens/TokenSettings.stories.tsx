import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import { paperProviderDecorator, gestureHandlerDecorator, navigationContainerDecorator, apolloClientMocksDecorator, appContextDecorator } from '@/lib/storiesUtil'
import TokenSettings from './TokenSettings'
import { GET_RESOURCES_WITHOUT_PIC } from './InfoHowToGet'
import { GraphQlLib } from '@/lib/backendFacade'

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
    }])
  ]
}

export default meta
type Story = StoryObj<typeof TokenSettings>

export const Common: Story = {
    name: 'Common token settings'
}