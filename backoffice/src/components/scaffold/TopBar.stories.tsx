import type { Meta, StoryObj } from '@storybook/react'
import TopBar from './TopBar'
import ClientWrapper from './ClientWrapper'

const meta = {
  component: TopBar,
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
} satisfies Meta<typeof TopBar>

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = {
  args: {
    version: 'v0_9'
  }
}
