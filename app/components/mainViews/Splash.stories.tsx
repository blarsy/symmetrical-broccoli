import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import Splash from './Splash'
import React  from 'react'

const meta: Meta<typeof Splash> = {
  component: Splash,
}

export default meta
type Story = StoryObj<typeof Splash>


export const Default: Story = {
  render: () => <Splash />,
}