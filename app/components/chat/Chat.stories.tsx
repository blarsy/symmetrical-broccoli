import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import { apolloClientMocksDecorator, appContextDecorator, configDayjsDecorator, gestureHandlerDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import Chat from './Chat'
import { name } from '@cloudinary/url-gen/actions/namedTransformation'
import { Avatar } from 'react-native-paper'

const meta: Meta<typeof Chat> = {
  component: Chat,
  decorators: [
    paperProviderDecorator,
    configDayjsDecorator,
    gestureHandlerDecorator
  ]
}

export default meta
type Story = StoryObj<typeof Chat>

const user1 = { id: 1, name: 'user 1', avatar: '' }
const user2 = { id: 2, name: 'user 2', avatar: '' }
const user2Deleted = { id: 2, name: '', avatar: '' }
const someMessages = [{
    id: 1, createdAt: new Date( new Date().valueOf() - 1000 * 60 * 60 * 51), text: 'oldest 2', user: user2
},{
    id: 2, createdAt: new Date( new Date().valueOf() - 1000 * 60 * 60 * 50), text: 'oldest 1', user: user1
},{
    id: 3, createdAt: new Date( new Date().valueOf() - 1000 * 60 * 60 * 49), text: 'reply 1', user: user2
},{
    id: 4, createdAt: new Date( new Date().valueOf() - 1000 * 60 * 60 * 37), text: 'reply 1', user: user1
},{
    id: 5, createdAt: new Date( new Date().valueOf() - 1000 * 60 * 60 * 36), text: 'newer', user: user2
},{
    id: 6, createdAt: new Date( new Date().valueOf() - 1000 * 60 * 60 * 12), text: 'newer 2', user: user2
},{
    id: 7, createdAt: new Date( new Date().valueOf() - 1000 * 60 * 3), text: 'minutes ago', user: user2
},{
    id: 8, createdAt: new Date( new Date().valueOf() - 1000 * 3), text: 'seconds ago', user: user2
},{
    id: 9, createdAt: new Date( new Date().valueOf() - 1000 ), text: 'second ago', user: user2
}]

export const LoadingView: Story = {
    name: 'Loading messages',
    args: {
      onSend: (text, imagePublicId) => {
          console.log('sending message', text, imagePublicId)
      },
      otherAccount: user1,
      messages: { loading: true }
    }
  }

  export const SimpleView: Story = {
    name: 'Some messages',
    args: {
      onSend: (text, imagePublicId) => {
          console.log('sending message', text, imagePublicId)
      },
      otherAccount: user1,
      messages: { loading: false, error: undefined, data: someMessages },
      onLoadEarlier: () => console.log('load earlier...')
    }
  }

  export const DisabledView: Story = {
    name: 'Some messages, cannot send because account deleted',
    args: {
      onSend: (text, imagePublicId) => {
          console.log('sending message', text, imagePublicId)
      },
      otherAccount: user2Deleted,
      messages: { loading: false, error: undefined, data: someMessages },
      onLoadEarlier: () => console.log('load earlier...')
    }
  }