import type { Meta, StoryObj } from '@storybook/react';

import React  from 'react'
import { paperProviderDecorator } from '@/lib/storiesUtil'
import LinkList from './LinkList'
import { LinkTypes } from '@/lib/schema'

const accountId = 1
const meta: Meta<typeof LinkList> = {
  component: LinkList,
  decorators: [
    paperProviderDecorator
  ]
}

export default meta
type Story = StoryObj<typeof LinkList>

export const Simple: Story = {
    name: 'Simple view',
    args: {
      values: [
        { type: LinkTypes.instagram, url: 'https://www.instagram.com/bertrand.larsy/', label: '', id: 1 },
        { type: LinkTypes.facebook, url: 'https://www.facebook.com/bertrand.larsy/', label: 'Mon Facebook !!', id: 2 },
        { type: LinkTypes.web, url: 'https://www.tope-la.com/', label: 'Site vitrine', id: 3 }
      ]
    }
}