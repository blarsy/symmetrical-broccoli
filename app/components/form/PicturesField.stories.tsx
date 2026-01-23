import type { Meta, StoryObj } from '@storybook/react';

import React  from 'react'
import PictureField from './PicturesField'
import { appContextDecorator, paperProviderDecorator } from '@/lib/storiesUtil'

const meta: Meta<typeof PictureField> = {
  component: PictureField,
  decorators: [
    paperProviderDecorator,
    appContextDecorator()
  ]
}

export default meta
type Story = StoryObj<typeof PictureField>

export const Primary: Story = {
  args: {
    
  },
  
}