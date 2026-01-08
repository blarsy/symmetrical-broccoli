import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import React  from 'react'
import InfoHowItWorks from './InfoHowItWorks'
import { apolloClientMocksDecorator, appContextDecorator, paperProviderDecorator } from '@/lib/storiesUtil'

const meta: Meta<typeof InfoHowItWorks> = {
  component: InfoHowItWorks,
  decorators: [paperProviderDecorator, appContextDecorator(false, false, 45), apolloClientMocksDecorator([])]
}

export default meta
type Story = StoryObj<typeof InfoHowItWorks>

export const Simple: Story = {
    name: 'Simple',
    decorators: []
}