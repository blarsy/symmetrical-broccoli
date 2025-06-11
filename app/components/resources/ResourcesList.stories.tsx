import type { Meta, StoryObj } from '@storybook/react'

import { RESOURCES, ResourcesList } from './ResourcesList'

import React  from 'react'
import { apolloClientMocksDecorator, appContextDecorator, configDayjsDecorator, gestureHandlerDecorator, makeAppContextProvider, navigationContainerDecorator, paperProviderDecorator, searchFilterContextDecorator } from '@/lib/storiesUtil'

const buildDecoratorList = (resourcesObj: any, willingToContribute: boolean = false) => [
  paperProviderDecorator, appContextDecorator(false, false, willingToContribute),
  gestureHandlerDecorator,
  navigationContainerDecorator(),
  searchFilterContextDecorator(), configDayjsDecorator,
  apolloClientMocksDecorator([ { 
    query: RESOURCES, 
    result: resourcesObj
  }])
]

const meta: Meta<typeof ResourcesList> = {
  component: ResourcesList
}

export default meta
type Story = StoryObj<typeof ResourcesList>

const futureDate = new Date(new Date().valueOf() + 1000*60*60*24)
const initialResourceList = { 
  myResources: {
    nodes: [
      { id: 1, title: 'Super ressource', description: 'description de la super ressource', expiration: futureDate, accountByAccountId: { name: 'super artisan' } },
      { id: 2, title: 'Location de ressource inutilisée', description: 'De toute façon, on en fait rien', expiration: futureDate, accountByAccountId: { name: 'super artisan' } },
      { id: 3, title: 'Super ressource', description: 'description de la super ressource', expiration: futureDate, accountByAccountId: { name: 'super artisan' } },
      { id: 4, title: 'Location de ressource inutilisée', description: 'De toute façon, on en fait rien', expiration: futureDate, accountByAccountId: { name: 'super artisan' } },
      { id: 5, title: 'Super ressource', description: 'description de la super ressource', expiration: futureDate, accountByAccountId: { name: 'super artisan' } },
      { id: 6, title: 'Location de ressource inutilisée', description: 'De toute façon, on en fait rien', expiration: futureDate, accountByAccountId: { name: 'super artisan' } },
      { id: 7, title: 'Super ressource', description: 'description de la super ressource', expiration: futureDate, accountByAccountId: { name: 'super artisan' } },
      { id: 8, title: 'Location de ressource inutilisée', description: 'De toute façon, on en fait rien', expiration: futureDate, accountByAccountId: { name: 'super artisan' } },
    ]
  } 
}

const resourceListWithOneDeleted = { 
  myResources: {
    nodes: [
      { id: 1, title: 'Super ressource', description: 'description de la super ressource', accountByAccountId: { name: 'super artisan' } },
      { id: 2, title: 'Location de ressource inutilisée', description: 'De toute façon, on en fait rien', deleted: new Date(), accountByAccountId: { name: 'super artisan' } }
    ]
  } 
}

const resourceListWithSomeSuspended = {
  myResources: {
    nodes: [
      { id: 1, title: 'Super ressource', description: 'description de la super ressource', accountByAccountId: { name: 'super artisan' } },
      { id: 1, title: 'Resource suspendud', description: 'description de la ressource', suspended: new Date(), accountByAccountId: { name: 'super artisan' } },
      { id: 3, title: 'Location de ressource inutilisée', description: 'De toute façon, on en fait rien', deleted: new Date(), accountByAccountId: { name: 'super artisan' } },
      { id: 4, title: 'Autre resource suspendue', description: 'desc', suspended: new Date(), accountByAccountId: { name: 'super artisan' } }
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
  decorators: buildDecoratorList(initialResourceList),
  args: initialArgs
}

export const WithDeleted: Story = {
  name: 'List with some deleted',
  decorators: buildDecoratorList(resourceListWithOneDeleted),
  args: initialArgs
}
export const Empty: Story = {
  name: 'List empty, with info',
  decorators: buildDecoratorList( { 
    myResources: {
      nodes: []
    } 
  }),
  args: initialArgs
}

export const WithSuspended: Story = {
  name: 'With some suspended resources',
  decorators: buildDecoratorList(resourceListWithSomeSuspended, true),
  args: initialArgs
}