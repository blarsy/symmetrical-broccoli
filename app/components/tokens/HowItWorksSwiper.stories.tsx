import type { Meta, StoryObj } from '@storybook/react';

import React  from 'react'
import HowItWorksSwiper from './HowItWorksSwiper'
import { apolloClientMocksDecorator, appContextDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import { Dimensions } from 'react-native'

const meta: Meta<typeof HowItWorksSwiper> = {
  component: HowItWorksSwiper,
  decorators: [paperProviderDecorator, apolloClientMocksDecorator([])]
}

export default meta
type Story = StoryObj<typeof HowItWorksSwiper>

export const Simple: Story = {
    name: 'Simple',
    args: { width: Dimensions.get('window').width },
    decorators: [appContextDecorator(false, false, 60)]
}

export const ExplainOnly: Story = {
    name: 'Explain only',
    args: { width: Dimensions.get('window').width },
    decorators: [appContextDecorator(false, false)]
}