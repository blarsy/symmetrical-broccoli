import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import HowItWorksSwiper from './HowItWorksSwiper'
import { apolloClientMocksDecorator, appContextDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import { GraphQlLib } from '@/lib/backendFacade'

const meta: Meta<typeof HowItWorksSwiper> = {
  component: HowItWorksSwiper,
  decorators: [paperProviderDecorator, apolloClientMocksDecorator([
    { query: GraphQlLib.mutations.SWITCH_TO_CONTRIBUTION_MODE, result: { switchToContributionMode: { integer: 1 } }  }
  ])]
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