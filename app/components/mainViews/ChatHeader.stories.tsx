import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import { ChatHeader } from './Chat'
import { paperProviderDecorator, conversationContextDecorator, gestureHandlerDecorator } from '@/lib/storiesUtil'
import { ConversationState } from '../chat/ConversationContextProvider'

const meta: Meta<typeof ChatHeader> = {
  component: ChatHeader,
  decorators: [
    paperProviderDecorator, gestureHandlerDecorator
  ]
}

export default meta
type Story = StoryObj<typeof ChatHeader>

const makeConversationData = (loading: boolean, canBeGifted: boolean, canBeExchanged: boolean, resourceDeleted: boolean, accountDeleted: boolean, accountName: string = 'Mon association trop bien', resourceTitle: string = 'Une super ressource' ) => ({
    conversation: {
        loading,
        data: { 
            resource: { 
                canBeGifted, 
                canBeExchanged,
                canBeDelivered: false,
                canBeTakenAway: false,
                title: resourceTitle,
                account: {
                    email: 'other@other.com',
                    id: 2,
                    name: accountDeleted ? '' : accountName
                },
                deleted: resourceDeleted ? new Date() : null,
                id: 1, images: [], description: 'description de la ressource', categories: [], isService: false, isProduct: false, created: new Date()
            },
            otherAccount: {
                id: 2,
                name: accountName
            },
            messages: [],
            endCursor: ''
        }
    }
} as ConversationState)

export const SimpleConversationView: Story = {
    name: 'Simple conversation',
    decorators: [
      conversationContextDecorator(makeConversationData(false, true, true, false, false))
    ]
}

export const LoadingView: Story = {
    name: 'Loading conversation',
    decorators: [
      conversationContextDecorator(makeConversationData(true, true, true, false, false))
    ]
}

export const DeletedResourceView: Story = {
    name: 'Conversation about deleted resource',
    decorators: [
      conversationContextDecorator(makeConversationData(false, false, true, true, false))
    ]
}

export const DeletedAccountView: Story = {
    name: 'Conversation with deleted account',
    decorators: [
      conversationContextDecorator(makeConversationData(false, false, true, false, true))
    ]
}

export const LongNamesView: Story = {
    name: 'Conversation with long account and resource names',
    decorators: [
      conversationContextDecorator(makeConversationData(false, false, true, false, false, 'Long account name Long account name Long account name', 'Long resource title Long resource title'))
    ]
}

