import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { useState } from 'react'
import { PriceTag } from '../misc'

const meta = {
  component: PriceTag,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {  },
  decorators: []
} satisfies Meta<typeof PriceTag>

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = {
  args: { value: 300 }
}

export const WithLabel: Story = {
  args: { value: 300, label: 'Prix ressource' }
}

export const SimpleBig: Story = {
  args: { value: 300, big: true }
}

export const WithLabelBig: Story = {
  args: { value: 300, label: 'Prix ressource', big: true }
}
