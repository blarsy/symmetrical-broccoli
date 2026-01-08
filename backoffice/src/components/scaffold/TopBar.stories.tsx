import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import TopBar from './TopBar'
import { clientComponentDecorator } from '@/lib/storiesUtil'

const meta = {
  component: TopBar,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {  }
} satisfies Meta<typeof TopBar>

export default meta
type Story = StoryObj<typeof meta>

export const LoggedOut: Story = {
  args: {
    version: 'v0_10'
  },
  decorators: [clientComponentDecorator() ]
}

export const LoggedIn: Story = {
  args: {
    version: 'v0_10'
  },
  decorators: [ clientComponentDecorator({
    loading: false, token: 'token', account: {
      amountOfTokens: 20, name: 'Les patines de Christine', id: 234, email: 'mail@mail.com',
      activated: new Date(new Date().valueOf() - 10000), lastChangeTimestamp: new Date(new Date().valueOf() - 10000),
      avatarPublicId: '', knowsAboutCampaigns: false
    }, unreadNotifications: [], subscriptions: []
  }) ]
}