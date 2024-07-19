import type { Meta, StoryObj } from '@storybook/react'

import { RESOURCES, ResourcesList } from './ResourcesList'

import React  from 'react'
import { apolloClientMocksDecorator, appContextDecorator, configDayjsDecorator, paperProviderDecorator, searchFilterContextDecorator } from '@/lib/storiesUtil'

const meta: Meta<typeof ResourcesList> = {
  component: ResourcesList,
  decorators: [
    paperProviderDecorator,
    appContextDecorator(), searchFilterContextDecorator(), configDayjsDecorator
  ]
}

export default meta
type Story = StoryObj<typeof ResourcesList>

const initialResourceList = { 
  myresources: {
    nodes: [
      { id: 1, title: 'Super ressource', description: 'description de la super ressource' },
      { id: 2, title: 'Location de ressource inutilisée', description: 'De toute façon, on en fait rien' },
    ]
  } 
}

const resourceListWithOneDeleted = { 
  myresources: {
    nodes: [
      { id: 1, title: 'Super ressource', description: 'description de la super ressource' },
      { id: 2, title: 'Location de ressource inutilisée', description: 'De toute façon, on en fait rien', deleted: new Date() }
    ]
  } 
}

const initialArgs = {
  route: {},
  addRequested: () => console.log('addrequested'),
  editRequested: () =>  console.log('editrequested'),
  viewRequested: (id) =>  console.log(`viewrequested, id ${id}`)
}

export const SimpleView: Story = {
  name: 'Simple list view',
  decorators: [
    apolloClientMocksDecorator([ { 
      query: RESOURCES, 
      result: initialResourceList
    }])
  ],
  args: initialArgs
}

export const WithDeleted: Story = {
  name: 'List with some deleted',
  decorators: [
    apolloClientMocksDecorator([ { 
      query: RESOURCES, 
      result: resourceListWithOneDeleted
    }])
  ],
  args: initialArgs
}
export const Empty: Story = {
  name: 'List empty, with info',
  decorators: [
    apolloClientMocksDecorator([ { 
      query: RESOURCES, 
      result: { 
        myresources: {
          nodes: []
        } 
      }
    }])
  ],
  args: initialArgs
}