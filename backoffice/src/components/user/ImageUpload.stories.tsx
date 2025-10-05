import type { Meta, StoryObj } from '@storybook/react'
import ImageUpload from './ImageUpload'
import { clientComponentDecorator } from '@/lib/storiesUtil'

const meta = {
  component: ImageUpload,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {  },
  decorators: [clientComponentDecorator(), ]
} satisfies Meta<typeof ImageUpload>

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = {
  args: {
      onUploaded: console.log
  }
}
