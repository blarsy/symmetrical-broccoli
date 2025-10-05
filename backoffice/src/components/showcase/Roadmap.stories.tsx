import type { Meta, StoryObj } from '@storybook/react'

import Roadmap from './Roadmap'
import { clientComponentDecorator } from '@/lib/storiesUtil'

const meta = {
  component: Roadmap,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {  },
  decorators: [clientComponentDecorator(), ]
} satisfies Meta<typeof Roadmap>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    
  }
}
