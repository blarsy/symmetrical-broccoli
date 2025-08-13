import type { Meta, StoryObj } from '@storybook/react'

import Search, { DEFAULT_SEARCH_PARAMETERS, SUGGEST_RESOURCES } from './Search'
import { apolloClientMocksDecorator } from '@/lib/storiesUtil'
import ClientWrapper from '../scaffold/ClientWrapper'

const makeResourceData = (id: number, title: string, description: string, accountName: string, avatarPublicId: string,
    resourceImagesPublicIds: string[]
) => ({ 
  id,
  title,
  description,
  suspended: null,
  price: null,
  paidUntil: null,
  accountByAccountId: {
    id,
    name: accountName,
    imageByAvatarImageId: {
      publicId: avatarPublicId
    }
  },
  created: new Date(),
  canBeExchanged: false,
  canBeGifted: false,
  resourcesImagesByResourceId: {
    nodes: resourceImagesPublicIds.map(publicId => ( { imageByImageId: { publicId } }))
  },
  resourcesResourceCategoriesByResourceId: {
    nodes: []
  }
})

const meta = {
  title: 'Default view',
  component: Search,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    //backgroundColor: { control: 'color' },
  },
  args: { 
    version: 'v0_9'
   },
  decorators: [(Story) => <ClientWrapper version="v0_9">
    <Story/>
  </ClientWrapper>, apolloClientMocksDecorator([{ query: SUGGEST_RESOURCES, variables: DEFAULT_SEARCH_PARAMETERS, result: {
    suggestedResources: {
      resources: [ 
        makeResourceData(1, 'resource title', 'resource description. No avatar. No resource image', 'account 1', '', []),
        makeResourceData(2, 'resource title with avatar', 'resource description. Avatar image. No resource image', 'account 1-1', 'w2nelofqkkbr5w2cedcc', []),
        makeResourceData(3, 'resource title', 'resource description. No avatar. 1 resource image', 'account 1-2', '', ['cybvpcvgnitnkk3ijfw5']),
        makeResourceData(4, 'resource title with avatar', 'resource description. No avatar. No resource image', 'account 1-3', 'w2nelofqkkbr5w2cedcc', ['sboopci7bbre34jezxu8', 'd96ifkunm53v7biuocaj']),
        makeResourceData(5, 'resource title', 'resource description', 'account 1-4', '', []),
        makeResourceData(6, 'resource title with avatar', 'resource description. No avatar. No resource image', 'account 1-5', 'w2nelofqkkbr5w2cedcc', ['sboopci7bbre34jezxu8', 'd96ifkunm53v7biuocaj', 'mbytebtndcp5w3qwax6a', 'nqwlakejznrz3tprsvom']),
      ]
    }
  } }])]
} satisfies Meta<typeof Search>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
  }
}
