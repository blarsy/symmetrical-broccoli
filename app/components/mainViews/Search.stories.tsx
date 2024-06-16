import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import { apolloClientMocksDecorator, appContextDecorator, editResourceContextDecorator, gestureHandlerDecorator, navigationContainerDecorator, paperProviderDecorator, searchFilterContextDecorator } from '@/lib/storiesUtil'
import Search from './Search'
import queryMocks from '@/lib/queryMocks'
import { fromData } from '@/lib/DataLoadState'

const meta: Meta<typeof Search> = {
    component: Search,
    decorators: [
        paperProviderDecorator,
        appContextDecorator(),
        navigationContainerDecorator(),
        gestureHandlerDecorator,
        editResourceContextDecorator,
        searchFilterContextDecorator(fromData([{
            id: 1, title: 'Ressource 1', description: 'Description de la ressource 1', canBeDelivered: true,
            canBeExchanged: false, canBeGifted: true, canBeTakenAway: true, isProduct: false, isService: true,
            categories: [], created: new Date(), images: [], account: { id: 1, name: 'Assoc de teubés', email: 'me@me.com' },
            deleted: null
        }, {
            id: 2, title: 'Ressource 2', description: 'Description de la ressource 2', canBeDelivered: false,
            canBeExchanged: true, canBeGifted: false, canBeTakenAway: true, isProduct: true, isService: false,
            categories: [], created: new Date(), images: [], account: { id: 1, name: 'Assoc de teubés', email: 'me@me.com' },
            deleted: null
        }])),
        apolloClientMocksDecorator([queryMocks.searchResult]),
    ]
  }

export default meta
type Story = StoryObj<typeof Search>

export const Initial: Story = {
    name: 'Initial view, empty filter',
    args: {},
    decorators: [
    ]
}