import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import React  from 'react'
import LoginForm from './LoginForm'
import { apolloClientMocksDecorator, appContextDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import PrimaryColoredContainer from '../layout/PrimaryColoredContainer'

const meta: Meta<typeof LoginForm> = {
  component: LoginForm,
  decorators: [
    (StoryElement: React.ElementType) => <PrimaryColoredContainer>
        <StoryElement/>
    </PrimaryColoredContainer>,
    paperProviderDecorator,
    apolloClientMocksDecorator([])
  ]
}

export default meta
type Story = StoryObj<typeof LoginForm>

export const Simple: Story = {
  args: {
    toggleRecovering: () => {},
    toggleRegistering: () => {}
  },
  
}