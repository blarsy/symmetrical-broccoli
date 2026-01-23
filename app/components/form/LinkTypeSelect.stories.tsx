import { paperProviderDecorator } from '@/lib/storiesUtil'
import type { Meta, StoryObj } from '@storybook/react';
import React  from 'react'
import LinkTypeSelect from './LinkTypeSelect'

const meta: Meta<typeof LinkTypeSelect> = {
  component: LinkTypeSelect,
  decorators: [ paperProviderDecorator ]
}

export default meta
type Story = StoryObj<typeof LinkTypeSelect>

export const Empty: Story = {
    args: {
    },
    
  }

export const FacebookSelected: Story = {
    args: {
        selected: 1
    },
    
  }