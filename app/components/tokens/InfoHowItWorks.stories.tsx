import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import InfoHowItWorks from './InfoHowItWorks'
import { apolloClientMocksDecorator, appContextDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import { GraphQlLib } from '@/lib/backendFacade'

const meta: Meta<typeof InfoHowItWorks> = {
  component: InfoHowItWorks,
  decorators: [paperProviderDecorator, appContextDecorator(false, false, false, 45), apolloClientMocksDecorator([
    { query: GraphQlLib.mutations.SWITCH_TO_CONTRIBUTION_MODE, result: { switchToContributionMode: { integer: 1 } }  }
  ])]
}

export default meta
type Story = StoryObj<typeof InfoHowItWorks>

export const Simple: Story = {
    name: 'Simple',
    decorators: []
}