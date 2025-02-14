import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import HowItWorksSwiper from './HowItWorksSwiper'
import { appContextDecorator, paperProviderDecorator } from '@/lib/storiesUtil'

const meta: Meta<typeof HowItWorksSwiper> = {
  component: HowItWorksSwiper,
  decorators: [paperProviderDecorator]
}

export default meta
type Story = StoryObj<typeof HowItWorksSwiper>

export const Simple: Story = {
    name: 'Simple',
    args: { width: 300 },
    decorators: [appContextDecorator(false, false, false, 60)]
}

export const ExplainOnly: Story = {
    name: 'Explain only',
    args: { width: 300 },
    decorators: [appContextDecorator(false, false, true)]
}