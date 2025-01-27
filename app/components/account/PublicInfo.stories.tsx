import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import { apolloClientMocksDecorator, appContextDecorator, gestureHandlerDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import PublicInfo, { GET_ACCOUNT_INFO } from './PublicInfo'
import PrimaryColoredContainer from '../layout/PrimaryColoredContainer'

const meta: Meta<typeof PublicInfo> = {
  component: PublicInfo,
  decorators: [
    Story => <PrimaryColoredContainer style={{ flex: 1, alignItems: 'stretch' }}><Story /></PrimaryColoredContainer>,
    paperProviderDecorator, gestureHandlerDecorator, appContextDecorator()
  ]
}

export default meta
type Story = StoryObj<typeof PublicInfo>

export const Simple: Story = {
  name: 'Simple public info view',
  decorators: [
    apolloClientMocksDecorator([{
      query: GET_ACCOUNT_INFO,
      variables: { id: 1 },
      result: {
        accountById: {
          id: 1,
          accountsLinksByAccountId: {
            nodes: [{
              label: 'label',
              url: 'http://url.com',
              id: 1,
              linkTypeByLinkTypeId: {
                id: 4
              }
            }]
          },
          locationByLocationId: {
            address: 'rue de la fontaine, 35, 7500 Tourné',
            latitude: 50.601820,
            longitude: 3.426574,
            id: 1
          }
        }
      }
    }])
  ]
}

export const NoAddress: Story = {
  name: 'No address',
  decorators: [
    apolloClientMocksDecorator([{
      query: GET_ACCOUNT_INFO,
      variables: { id: 1 },
      result: {
        accountById: {
          accountsLinksByAccountId: {
            nodes: [{
              label: 'label',
              url: 'http://url.com',
              id: 1,
              linkTypeByLinkTypeId: {
                id: 4
              }
            }]
          },
          locationByLocationId: null
        }
      }
    }])
  ]
}