import type { Meta, StoryObj } from '@storybook/react'

import React = require('react')
import CategoriesSelect from './CategoriesSelect';
import { PaperProvider } from 'react-native-paper';
import { appContextDecorator } from '@/lib/storiesUtil';

const meta: Meta<typeof CategoriesSelect> = {
  component: CategoriesSelect,
  decorators: [
    (Story) => <PaperProvider>
        <Story/>
    </PaperProvider>,
    appContextDecorator
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