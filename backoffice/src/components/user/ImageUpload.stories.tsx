import type { Meta, StoryObj } from '@storybook/react'
import ImageUpload from './ImageUpload'
import ClientWrapper from '../scaffold/ClientWrapper'

const meta = {
  component: ImageUpload,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {  },
  decorators: [(Story) => <ClientWrapper version="v0_9">
      <Story/>
    </ClientWrapper>]
} satisfies Meta<typeof ImageUpload>

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = {
  args: {
      onUploaded: console.log
  }
}
