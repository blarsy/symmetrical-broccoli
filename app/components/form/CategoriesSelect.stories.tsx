import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import React  from 'react'
import CategoriesSelect from './CategoriesSelect'
import { appContextDecorator, paperProviderDecorator } from '@/lib/storiesUtil'

const meta: Meta<typeof CategoriesSelect> = {
  component: CategoriesSelect,
  decorators: [
    paperProviderDecorator,
    appContextDecorator()
  ]
}

export default meta
type Story = StoryObj<typeof CategoriesSelect>

export const Primary: Story = {
  args: {
    onChange: console.log,
    value: []
  },
  
}