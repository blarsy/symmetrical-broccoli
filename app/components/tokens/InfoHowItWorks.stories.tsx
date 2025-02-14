import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import InfoHowItWorks from './InfoHowItWorks'
import { appContextDecorator, paperProviderDecorator } from '@/lib/storiesUtil'

const meta: Meta<typeof InfoHowItWorks> = {
  component: InfoHowItWorks,
  decorators: [paperProviderDecorator, appContextDecorator(false, false, false, 45)]
}

export default meta
type Story = StoryObj<typeof InfoHowItWorks>

export const Simple: Story = {
    name: 'Simple',
    decorators: []
}