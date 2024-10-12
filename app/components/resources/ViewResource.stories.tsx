import type { Meta, StoryObj } from '@storybook/react'

import React from 'react'
import { apolloClientMocksDecorator, appContextDecorator, configDayjsDecorator, makeAppContextProvider, paperProviderDecorator } from '@/lib/storiesUtil'
import ViewResource from './ViewResource'
import { GET_RESOURCE } from '@/lib/utils'

const meta: Meta<typeof ViewResource> = {
  component: ViewResource,
  decorators: [
    paperProviderDecorator,
    configDayjsDecorator,
    appContextDecorator()
  ]
}

export default meta
type Story = StoryObj<typeof ViewResource>

const initialArgs = {
  route: { params: { resourceId: 1 }, name: 'Irrelevant'},
  addRequested: () => console.log('addrequested'),
  editRequested: () =>  console.log('editrequested'),
  viewRequested: (id: number) =>  console.log(`viewrequested, id ${id}`)
}

const threeImages = [        
  { 
    imageByImageId: {
      publicId: 'cwhkuoqezdqyrot6hoez'
    }
  },
  { 
    imageByImageId: {
      publicId: 'pwb8arnohwpjahnebyxj'
    }
  },
  { 
    imageByImageId: {
      publicId: 'occysgyx6m8kk5y51myu'
    }
  }
]

const oneImage = [
  { 
    imageByImageId: {
      publicId: 'cwhkuoqezdqyrot6hoez'
    }
  }
]

const simpleResource = (isDeleted: boolean = false, threeImage: boolean = true, 
    hasAddress: boolean = false, title: string = 'Une super ressource', 
    accountName: string = 'Artisan incroyable') => ({
    resourceById: {
        canBeDelivered: true,
        canBeExchanged: true,
        canBeGifted: true,
        canBeTakenAway: true,
        description: 'description de la ressource',
        id: 1,
        isProduct: true,
        isService: true,
        expiration: new Date(2025,1,1),
        title,
        created: new Date(2022, 1, 1),
        deleted: isDeleted ? new Date() : null,
        accountByAccountId: {
            email: 'me@me.com',
            id: 12,
            name: accountName,
            imageByAvatarImageId: { publicId: '' }
        },
        resourcesImagesByResourceId: {
            nodes: threeImage ? threeImages : oneImage
        },
        resourcesResourceCategoriesByResourceId: {
            nodes: [{
              resourceCategoryCode: 'cat2'
            },
            {
                resourceCategoryCode: 'cat4'
            }]
        },
        locationBySpecificLocationId: hasAddress ? {
          address: 'Rue de la resource, 123',
          latitude: 50,
          longitude: 3,
          id: 1
        }: null
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

export const SingleImageView: Story = {
  name: 'Single image view',
  decorators: [
    apolloClientMocksDecorator([ { 
      query: GET_RESOURCE,
      variables: {
        id: 1
      },
      result: simpleResource(false, false)
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
export const WithSpecificAddress: Story = {
    name: 'View resource with an address',
    decorators: [
      apolloClientMocksDecorator([ { 
        query: GET_RESOURCE,
        variables: {
          id: 1
        },
        result: simpleResource(true,false, true)
      }])
    ],
    args: initialArgs
}

export const WithLongTexts: Story = {
  name: 'View resource with long texts',
  decorators: [
    apolloClientMocksDecorator([ { 
      query: GET_RESOURCE,
      variables: {
        id: 1
      },
      result: simpleResource(false, false, true, 'Un titre de ressource abusé comme il est trop long', `Un nom d'activité déliramment trop long aussi`)
    }])
  ],
  args: initialArgs
}

export const OwnResource: Story = {
  name: 'View rown esource',
  decorators: [
    apolloClientMocksDecorator([ { 
      query: GET_RESOURCE,
      variables: {
        id: 1
      },
      result: simpleResource(false, false, true, 'Un titre de ressource', 'Super artisan')
    }]),
    (StoryElement: React.ElementType) => 
        makeAppContextProvider(StoryElement, { id: 12, email: 'me@me.com', name: 'Super artisan', avatarPublicId: '', activated: new Date() })
  ],
  args: initialArgs,
}