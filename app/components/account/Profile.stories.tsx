import type { Meta, StoryObj } from '@storybook/react';

import React  from 'react'
import Profile from './Profile'
import { apolloClientMocksDecorator, appContextDecorator, navigationContainerDecorator, gestureHandlerDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import { GET_PREFERENCES } from './Preferences'
import { GET_ACCOUNT_INFO } from '../form/EditProfile'

const meta: Meta<typeof Profile> = {
  component: Profile,
  decorators: [
    paperProviderDecorator, gestureHandlerDecorator, navigationContainerDecorator(), apolloClientMocksDecorator([{
      query: GET_ACCOUNT_INFO,
      variables: { id: 1 },
      result: {
        me: {
          id: 1,
          accountsLinksByAccountId: {
            nodes: [{
              label: 'label',
              url: 'http://url.com',
              id: 1,
              linkTypeByLinkTypeId: {
                id: 4
              }
            },{
              label: 'Un très long texte de lien 0987654321',
              url: 'http://url.com/098765432109876543210987654321098765432110987654321',
              id: 2,
              linkTypeByLinkTypeId: {
                id: 1
              }
            }]
          },
          locationByLocationId: {
            address: 'Rue de la paix, 7',
            id: 1,
            latitude: 50.611820,
            longitude: 3.416574,
          }
        }
      }
    }, {
      query: GET_PREFERENCES,
      variables: {id: 1},
      result: {
        me: {
          broadcastPrefsByAccountId: {
            nodes: [{
              eventType: 1,
              id: 1,
              daysBetweenSummaries: -1
            },{
              eventType: 2,
              id: 2,
              daysBetweenSummaries: 3
            },{
              eventType: 1,
              id: 3,
              daysBetweenSummaries: -1
            },{
              eventType: 2,
              id: 4,
              daysBetweenSummaries: 4
            }]
          }
        },
        locationByLocationId: {
          address: 'Rue de la vache, 3',
          id: 1,
          latitude: 50.591820,
          longitude: 3.416574,
        }
      }
    }])
  ]
}

export default meta
type Story = StoryObj<typeof Profile>

export const Simple: Story = {
    name: 'Simple profile view',
    decorators: [
      appContextDecorator()
    ]
}