import type { Meta, StoryObj } from '@storybook/react'

import React from 'react'
import { apolloClientMocksDecorator, appContextDecorator, configDayjsDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import LoadedZone from './LoadedZone'
import { Text } from 'react-native-paper'

const meta: Meta<typeof LoadedZone> = {
  component: LoadedZone,
  decorators: [
    paperProviderDecorator
  ]
}

export default meta
type Story = StoryObj<typeof LoadedZone>

export const Loading: Story = {
    name: 'Loading',
    args: {
        loading: true,
        error: undefined,
        children: <Text>This is our content</Text>
    }
  }

export const Error: Story = {
    name: 'Error',
    args: {
        loading: false,
        error: { message: 'error message', name: 'error name', detail: 'error details', stack: 'error stack trace' },
        children: <Text>This is our content</Text>
    }
}

export const Loaded: Story = {
    name: 'Loaded',
    args: {
        loading: false,
        children: <Text>This is our content</Text>
    }
}