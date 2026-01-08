import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import UpdateApp from './UpdateApp'
import React  from 'react'
import { paperProviderDecorator } from '@/lib/storiesUtil'

const meta: Meta<typeof UpdateApp> = {
  component: UpdateApp,
  decorators: [paperProviderDecorator]
}

export default meta
type Story = StoryObj<typeof UpdateApp>

export const Default: Story = {
}