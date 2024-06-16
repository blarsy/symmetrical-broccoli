import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import Profile from './Profile'
import { apolloClientMocksDecorator, appContextDecorator, paperProviderDecorator } from '@/lib/storiesUtil'

const meta: Meta<typeof Profile> = {
  component: Profile,
  decorators: [
    paperProviderDecorator, apolloClientMocksDecorator([])
  ]
}

export default meta
type Story = StoryObj<typeof Profile>

export const Simple: Story = {
    name: 'Simple profile view',
    decorators: [
      appContextDecorator()
    ]
}