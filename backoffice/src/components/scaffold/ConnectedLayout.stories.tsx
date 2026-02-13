import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { clientComponentDecorator } from '@/lib/storiesUtil'
import { ConnectContent } from './ConnectedLayout';
import { Typography } from '@mui/material';
import config from '@/tests/config';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { getCommonConfig } from '@/config';
import { v4 } from 'uuid';

const { googleApiKey } = getCommonConfig()

const meta = {
  component: ConnectContent,
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
} satisfies Meta<typeof ConnectContent>

export default meta
type Story = StoryObj<typeof meta>

export const NewChatMessage: Story = {
  args: {
    version: config.version, children: <Typography>Content</Typography>,
    allowAnonymous: true
  },
  decorators: [clientComponentDecorator({ token: 'token', unreadNotifications: [], 
    loading: false, subscriptions: [], account: {
      id: v4(), activated: new Date(), amountOfTokens: 0, avatarPublicId: '',
      email: '', knowsAboutCampaigns: false, lastChangeTimestamp: new Date(), name: 'Sender name'
    }
  }, { newChatMessage: { 
    conversationId: v4(), senderId: v4(), created: new Date(), senderName: 'sender name', 
    text: 'You see ? This is my message', resourceId: v4(), resourceName: 'resource', senderAvatarPublicId: ''
   }, conversations: [], unreadConversations: [] }), Story => <GoogleOAuthProvider clientId={googleApiKey}>
    <Story/>
  </GoogleOAuthProvider> ]
}


export const HugeMessage: Story = {
  args: {
    version: config.version, children: <Typography>Content</Typography>,
    allowAnonymous: true
  },
  decorators: [clientComponentDecorator({ token: 'token', unreadNotifications: [], 
    loading: false, subscriptions: [], account: {
      id: v4(), activated: new Date(), amountOfTokens: 0, avatarPublicId: '',
      email: '', knowsAboutCampaigns: false, lastChangeTimestamp: new Date(), name: 'Sender name'
    }
  }, { newChatMessage: { 
    conversationId: v4(), senderId: v4(), created: new Date(), senderName: 'sender name', senderAvatarPublicId: '',
    text: `It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy. Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).`, resourceId: v4(), resourceName: 'resource'
   }, conversations: [], unreadConversations: [] }), Story => <GoogleOAuthProvider clientId={googleApiKey}>
    <Story/>
  </GoogleOAuthProvider> ]
}