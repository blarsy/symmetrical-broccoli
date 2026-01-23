import type { Meta, StoryObj } from '@storybook/react';

import React  from 'react'
import { apolloClientMocksDecorator, appContextDecorator, configDayjsDecorator, statusBarCompensatorDecorator, 
    gestureHandlerDecorator, navigationContainerDecorator, paperProviderDecorator } from '@/lib/storiesUtil'
import DealBoard from './DealBoard'
import queryMocks from '@/lib/queryMocks'

const meta: Meta<typeof DealBoard> = {
  component: DealBoard,
  decorators: [
    paperProviderDecorator, configDayjsDecorator, statusBarCompensatorDecorator,
    navigationContainerDecorator(), gestureHandlerDecorator
  ]
}

export default meta
type Story = StoryObj<typeof DealBoard>

export const SimpleView: Story = {
    name: 'Simple view',
    decorators: [
      apolloClientMocksDecorator([queryMocks.searchResultWithoutLocation, queryMocks.getResource1ToView, queryMocks.getResource2ToView, queryMocks.getResource3ToView, queryMocks.getAccount1, queryMocks.getAccount2, queryMocks.getNoAccountLocation ]), 
      appContextDecorator()
    ],
    args: { route: {}}
}

export const NotLoggedIn: Story = {
  name: 'not logged in',
  decorators: [
    apolloClientMocksDecorator([queryMocks.searchResultWithoutLocation, queryMocks.getResource1ToView, queryMocks.getResource2ToView, queryMocks.getResource3ToView, queryMocks.getAccount1, queryMocks.getAccount2 ]), 
    appContextDecorator(true)
  ],
  args: { route: {}}
}

export const loggedInWithAccountLogo: Story = {
  name: 'Logged in, account has logo',
  decorators: [
    apolloClientMocksDecorator([queryMocks.searchResultWithoutLocation, queryMocks.getResource1ToView, queryMocks.getResource2ToView, queryMocks.getResource3ToView, queryMocks.getAccount1, queryMocks.getAccount2, queryMocks.getNoAccountLocation ]), 
    appContextDecorator(false, false)
  ],
  args: { route: {}}
}

export const loggedInWithAccountAddress: Story = {
  name: 'Logged in, account has address',
  decorators: [
    apolloClientMocksDecorator([queryMocks.searchResultWithDefaultAccountLocation, queryMocks.getResource1ToView, queryMocks.getResource2ToView, queryMocks.getResource3ToView, queryMocks.getAccount1, queryMocks.getAccount2, queryMocks.getAccountLocation ]), 
    appContextDecorator(false, false)
  ],
  args: { route: {}}
}