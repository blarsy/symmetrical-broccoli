import type { Meta, StoryObj } from '@storybook/react';

import React from 'react'
import { apolloClientMocksDecorator, appContextDecorator, configDayjsDecorator, makeAppContextProvider, paperProviderDecorator, singleResource } from '@/lib/storiesUtil'
import ViewResource from './ViewResource'
import { GET_RESOURCE } from '@/lib/utils'
import { v4 } from 'uuid';

const meta: Meta<typeof ViewResource> = {
  component: ViewResource,
  decorators: [
    paperProviderDecorator,
    configDayjsDecorator,
    appContextDecorator()
  ]
}

const simpleResource = (id?: string, isDeleted: boolean = false, threeImage: boolean = true, 
  hasAddress: boolean = false, title: string = 'Une super ressource', 
  accountName: string = 'Artisan incroyable') => ({
  resourceById: singleResource(id, isDeleted, threeImage, hasAddress, title, accountName)
})

export default meta
type Story = StoryObj<typeof ViewResource>

const initialArgs = {
  route: { params: { resourceId: 1 }, name: 'Irrelevant'},
  addRequested: () => console.log('addrequested'),
  editRequested: () =>  console.log('editrequested'),
  viewRequested: (id: string) =>  console.log(`viewrequested, id ${id}`)
}

const resId = v4()
export const SimpleView: Story = {
  name: 'Simple view',
  decorators: [
    apolloClientMocksDecorator([ { 
      query: GET_RESOURCE,
      variables: {
        id: resId
      },
      result: simpleResource(resId, false)
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
        id: resId
      },
      result: simpleResource(resId, false, false)
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
        id: resId
      },
      result: simpleResource(resId, true)
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
          id: resId
        },
        result: simpleResource(resId, true,false, true)
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
        id: resId
      },
      result: simpleResource(resId, false, false, true, 'Un titre de ressource abusé comme il est trop long', `Un nom d'activité déliramment trop long aussi`)
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
        id: resId
      },
      result: simpleResource(resId, false, false, true, 'Un titre de ressource', 'Super artisan')
    }]),
    (StoryElement: React.ElementType) => 
        makeAppContextProvider(StoryElement, { id: v4(), email: 'me@me.com', name: 'Super artisan', avatarPublicId: '', activated: new Date(), amountOfTokens: 0, unreadConversations: [v4(),v4(),v4()], lastChangeTimestamp: new Date(), unreadNotifications: [v4(),v4(),v4()], numberOfExternalAuthProviders: 0, knowsAboutCampaigns: false })
  ],
  args: initialArgs,
}