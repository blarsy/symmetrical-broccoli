import type { Meta, StoryObj } from '@storybook/react'

import React  from 'react'
import { apolloClientMocksDecorator, appContextDecorator, configDayjsDecorator, fontsLoaderDecorator, 
    gestureHandlerDecorator, navigationContainerDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import DealBoard from './DealBoard'
import queryMocks from '@/lib/queryMocks'

const meta: Meta<typeof DealBoard> = {
  component: DealBoard,
  decorators: [
    paperProviderDecorator, configDayjsDecorator,
    navigationContainerDecorator(), gestureHandlerDecorator
  ]
}

export default meta
type Story = StoryObj<typeof DealBoard>

export const SimpleView: Story = {
    name: 'Simple view',
    decorators: [
      apolloClientMocksDecorator([queryMocks.searchResult, queryMocks.getResource1ToView, queryMocks.getResource2ToView, queryMocks.getResource3ToView, queryMocks.getAccount1, queryMocks.getAccount2 ]), 
      appContextDecorator()
    ],
    args: { route: {}}
}

export const NotLoggedIn: Story = {
  name: 'not logged in',
  decorators: [
    apolloClientMocksDecorator([queryMocks.searchResult, queryMocks.getResource1ToView, queryMocks.getResource2ToView, queryMocks.getResource3ToView, queryMocks.getAccount1, queryMocks.getAccount2 ]), 
    appContextDecorator(true)
  ],
  args: { route: {}}
}

export const loggedInWithAccountLogo: Story = {
  name: 'Logged in, account has logo',
  decorators: [
    apolloClientMocksDecorator([queryMocks.searchResult, queryMocks.getResource1ToView, queryMocks.getResource2ToView, queryMocks.getResource3ToView, queryMocks.getAccount1, queryMocks.getAccount2 ]), 
    appContextDecorator(false, false)
  ],
  args: { route: {}}
}