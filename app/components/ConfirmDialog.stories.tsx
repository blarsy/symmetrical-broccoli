import type { Meta, StoryObj } from '@storybook/react'

import ConfirmDialog from './ConfirmDialog'
import React  from 'react'
import { paperProviderDecorator } from '@/lib/storiesUtil'

const meta: Meta<typeof ConfirmDialog> = {
  component: ConfirmDialog,
  decorators: [paperProviderDecorator]
}

export default meta
type Story = StoryObj<typeof ConfirmDialog>

export const Default: Story = {
  args: {
    question: 'question', title: 'title', visible: true, onResponse: async res => console.log(`Response ${res}`)
  }
}