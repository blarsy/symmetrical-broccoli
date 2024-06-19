import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import Profile from './Profile'
import { apolloClientMocksDecorator, appContextDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import { GET_ACCOUNT_INFO } from '../form/EditProfile'

const meta: Meta<typeof Profile> = {
  component: Profile,
  decorators: [
    paperProviderDecorator, apolloClientMocksDecorator([{
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
            },{
              label: 'Un très long texte de lien 0987654321',
              url: 'http://url.com/098765432109876543210987654321098765432110987654321',
              id: 2,
              linkTypeByLinkTypeId: {
                id: 1
              }
            }]
          }
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