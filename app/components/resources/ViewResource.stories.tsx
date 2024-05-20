import type { Meta, StoryObj } from '@storybook/react'

import React from 'react'
import { apolloClientMocksDecorator, appContextDecorator, configDayjsDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import ViewResource from './ViewResource'
import { GET_RESOURCE } from '@/lib/utils'

const meta: Meta<typeof ViewResource> = {
  component: ViewResource,
  decorators: [
    paperProviderDecorator,
    configDayjsDecorator,
    appContextDecorator
  ]
}

export default meta
type Story = StoryObj<typeof ViewResource>

const initialArgs = {
  route: { params: { resourceId: 1 }},
  addRequested: () => console.log('addrequested'),
  editRequested: () =>  console.log('editrequested'),
  viewRequested: (id) =>  console.log(`viewrequested, id ${id}`)
}

const simpleResource = (isDeleted: boolean = false) => ({
    resourceById: {
        canBeDelivered: true,
        canBeExchanged: true,
        canBeGifted: true,
        canBeTakenAway: true,
        description: 'description',
        id: 1,
        isProduct: true,
        isService: true,
        expiration: new Date(2025,1,1),
        title: 'title',
        created: new Date(2022, 1, 1),
        deleted: isDeleted ? new Date() : null,
        accountByAccountId: {
            email: 'me@me.com',
            id: 12,
            name: 'account-name',
            imageByAvatarImageId: { publicId: '' }
        },
        resourcesImagesByResourceId: {
            nodes: []
        },
        resourcesResourceCategoriesByResourceId: {
            nodes: [{
              resourceCategoryCode: 'cat2'
            },
            {
                resourceCategoryCode: 'cat4'
            }]
        }
    }
})

export const SimpleView: Story = {
    name: 'Simple view',
    decorators: [
      apolloClientMocksDecorator([ { 
        query: GET_RESOURCE,
        variables: {
          id: 1
        },
        result: simpleResource(false)
      }])
    ],
    args: initialArgs
  }

export const DeletedView: Story = {
    name: 'View deleted resource',
    decorators: [
      apolloClientMocksDecorator([ { 
        query: GET_RESOURCE,
        variables: {
          id: 1
        },
        result: simpleResource(true)
      }])
    ],
    args: initialArgs
  }