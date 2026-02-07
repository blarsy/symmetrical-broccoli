import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import Search, { DEFAULT_SEARCH_PARAMETERS, SUGGEST_RESOURCES } from './Search'
import { apolloClientMocksDecorator, clientComponentDecorator } from '@/lib/storiesUtil'
import { v4 } from 'uuid';

const makeResourceData = (id: string, title: string, description: string, accountName: string, avatarPublicId: string,
    resourceImagesPublicIds: string[]
) => ({ 
  id,
  title,
  description,
  price: null,
  accountsPublicDatumByAccountId: {
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
  decorators: [apolloClientMocksDecorator([{ query: SUGGEST_RESOURCES, variables: DEFAULT_SEARCH_PARAMETERS, result: {
    suggestedResources: {
      resources: [ 
        makeResourceData(v4(), 'resource title', 'resource description. No avatar. No resource image', 'account 1', '', []),
        makeResourceData(v4(), 'resource title with avatar', 'resource description. Avatar image. No resource image', 'account 1-1', 'w2nelofqkkbr5w2cedcc', []),
        makeResourceData(v4(), 'resource title', 'resource description. No avatar. 1 resource image', 'account 1-2', '', ['cybvpcvgnitnkk3ijfw5']),
        makeResourceData(v4(), 'resource title with avatar', 'resource description. No avatar. No resource image', 'account 1-3', 'w2nelofqkkbr5w2cedcc', ['sboopci7bbre34jezxu8', 'd96ifkunm53v7biuocaj']),
        makeResourceData(v4(), 'resource title', 'resource description', 'account 1-4', '', []),
        makeResourceData(v4(), 'resource title with avatar', 'resource description. No avatar. No resource image', 'account 1-5', 'w2nelofqkkbr5w2cedcc', ['sboopci7bbre34jezxu8', 'd96ifkunm53v7biuocaj', 'mbytebtndcp5w3qwax6a', 'nqwlakejznrz3tprsvom']),
      ]
    }
  } }]), clientComponentDecorator()]
} satisfies Meta<typeof Search>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
  }
}
