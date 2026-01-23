import type { Meta, StoryObj } from '@storybook/react';

import React  from 'react'
import { apolloClientMocksDecorator, appContextDecorator, gestureHandlerDecorator, navigationContainerDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import Preferences, { GET_PREFERENCES } from './Preferences'

const accountId = 1
const meta: Meta<typeof Preferences> = {
  component: Preferences,
  decorators: [
    paperProviderDecorator, appContextDecorator(), navigationContainerDecorator(), gestureHandlerDecorator, apolloClientMocksDecorator([
        { query: GET_PREFERENCES, variables: { id: accountId }, result: {
            accountById: { broadcastPrefsByAccountId: { nodes: [{ eventType: 1, id: 1, daysBetweenSummaries: 2 }] } }
        } }
    ])
  ]
}

export default meta
type Story = StoryObj<typeof Preferences>

export const Simple: Story = {
    name: 'Simple view',
    args: {}
}