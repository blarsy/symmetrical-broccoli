import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import EditResource from './EditResource';
import { apolloClientMocksDecorator, appContextDecorator, editResourceContextDecorator, gestureHandlerDecorator, paperProviderDecorator, searchFilterContextDecorator } from '@/lib/storiesUtil';
import { ACCOUNT_LOCATION } from './EditResourceFields';

const meta: Meta<typeof EditResource> = {
  component: EditResource,
  decorators: [
    searchFilterContextDecorator(), 
    gestureHandlerDecorator, paperProviderDecorator
  ]
}

export default meta
type Story = StoryObj<typeof EditResource>

export const EditNew: Story = {
    name: 'New resource, connected account has an address',
    decorators: [appContextDecorator(), editResourceContextDecorator(), apolloClientMocksDecorator([{
        query: ACCOUNT_LOCATION,
        variables: { id: 1 },
        result: {
            accountById: {
                locationByLocationId: {
                    address: 'Rue de la picole, 36, 7500 Tournai',
                    latitude: 50,
                    longitude: 3,
                    id: 1
                }
            }
        }
    }])],
    args: {
        route : { params: { isNew: true }}
    }
}

export const EditExisting: Story = {
    name: 'Existing resource, connected account has an address, resource has an address',
    decorators: [appContextDecorator(), editResourceContextDecorator({
        id: 1, canBeDelivered: true, canBeExchanged: true, canBeGifted: true, canBeTakenAway: true, isProduct: true,
        isService: true, created: new Date(), deleted: null, categories: [], description: 'description de la ressource',
        title: 'Titre de ressource alléchant', images: [], expiration: new Date(new Date().valueOf() + 1000 * 60 * 60 * 24),
        specificLocation: { address: `Rue de l'adresse spécifique, 1, 10000, Gloupgloup`, latitude: 51, longitude: 4 }
    }), apolloClientMocksDecorator([{
        query: ACCOUNT_LOCATION,
        variables: { id: 1 },
        result: {
            accountById: {
                locationByLocationId: {
                    address: 'Rue de la picole, 36, 7500 Tournai',
                    latitude: 50,
                    longitude: 3,
                    id: 1
                }
            }
        }
    }])],
    args: {
        route : { params: { isNew: true }}
    }
}

export const EditNewWithoutAddress: Story = {
    name: 'New resource, connected account has no address',
    decorators: [appContextDecorator(), editResourceContextDecorator(), apolloClientMocksDecorator([{
        query: ACCOUNT_LOCATION,
        variables: { id: 1 },
        result: {
            accountById: {
                locationByLocationId: null
            }
        }
    }])],
    args: {
        route : { params: { isNew: true }}
    }
}

export const EditNewWithNoConnectedAccount: Story = {
    name: 'New resource, no connected account',
    decorators: [appContextDecorator(true), editResourceContextDecorator(), apolloClientMocksDecorator([])],
    args: {
        route : { params: { isNew: true }}
    }
}