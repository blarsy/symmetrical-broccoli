import type { Meta, StoryObj } from '@storybook/react'

import ConfirmDialog from './ConfirmDialog'
import React = require('react')
import { paperProviderDecorator } from '@/lib/storiesUtil'

const meta: Meta<typeof ConfirmDialog> = {
  component: ConfirmDialog,
  decorators: [paperProviderDecorator]
}

export default meta
type Story = StoryObj<typeof ConfirmDialog>

/*
 *👇 Render functions are a framework specific feature to allow you control on how the component renders.
 * See https://storybook.js.org/docs/api/csf
 * to learn how to use render functions.
 */
export const Default: Story = {
  args: {
    question: 'question', title: 'title', visible: true, onResponse: async res => console.log(`Response ${res}`)
  }
}