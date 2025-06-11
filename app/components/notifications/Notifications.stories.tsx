import type { Meta, StoryObj } from '@storybook/react'

import Notifications, { GET_NOTIFICATIONS, GET_RESOURCES } from './Notifications'
import React  from 'react'
import { apolloClientMocksDecorator, appContextDecorator, configDayjsDecorator, gestureHandlerDecorator, navigationContainerDecorator, paperProviderDecorator, singleResource } from '@/lib/storiesUtil'
import { daysFromNow } from '@/lib/utils'

const meta: Meta<typeof Notifications> = {
  component: Notifications,
  decorators: [paperProviderDecorator, appContextDecorator(), navigationContainerDecorator(), 
    gestureHandlerDecorator, configDayjsDecorator,
    apolloClientMocksDecorator([
    { query: GET_NOTIFICATIONS, variables: { first: 20}, result: {
        myNotifications: {
            edges: [{
                node: {
                    created: daysFromNow(-2),
                    data: { info: 'COMPLETE_PROFILE' },
                    id: 1,
                    read: null
                },
              },{
                node: {
                    created: daysFromNow(-1.5),
                    data: { info: 'SOME_RESOURCES_SUSPENDED' },
                    id: 2,
                    read: null
                },
              },{
                node: {
                    created: daysFromNow(-1),
                    data: { info: 'WARNING_LOW_TOKEN_AMOUNT' },
                    id: 3,
                    read: null
                },
              },{
                node: {
                    created: daysFromNow(-0.5),
                    data: { resource_id: 123 },
                    id: 4,
                    read: null
                },
              },{
                node: {
                    created: daysFromNow(-0.01),
                    data: { resource_id: 321 },
                    id: 5,
                    read: null
                },
              },],
            pageInfo: {
                hasNextPage: false,
                endCursor: 'qklmeflezj'
            }
        }
    } },
    { query: GET_RESOURCES, variables: { resourceIds: [123, 321]}, result: {
        getResources: {
            nodes: [ singleResource(123), singleResource(321)]
        }
    } }
  ])]
}

export default meta
type Story = StoryObj<typeof Notifications>

export const Default: Story = {
  args: {

  }
}