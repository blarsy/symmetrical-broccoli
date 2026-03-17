import type { Meta, StoryObj } from '@storybook/react';

import React from 'react'
import { paperProviderDecorator } from '@/lib/storiesUtil'
import PriceSetter from './PriceSetter';

const meta: Meta<typeof PriceSetter> = {
  component: PriceSetter,
  decorators: [
    paperProviderDecorator
  ]
}

export default meta
type Story = StoryObj<typeof PriceSetter>

export const Empty: Story = {
    name: 'Empty with default value',
    args: {
        value: 20
    },
    decorators: [
        (Story) => {
            const [value, setValue] = React.useState<number | undefined>(20)
            return <Story args={{ value, onChange: setValue }}/>
        } 
    ]
  }