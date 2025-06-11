import type { Meta, StoryObj } from '@storybook/react'
import CategoriesSelector from './CategoriesSelector'
import { apolloClientMocksDecorator, appContextDecorator } from '@/lib/storiesUtil'
import { GET_CATEGORIES } from '@/lib/useCategories'
import { initial } from '@/lib/DataLoadState'

const meta = {
  component: CategoriesSelector,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {  },
  decorators: [apolloClientMocksDecorator([
    {
        query: GET_CATEGORIES,
        variables: { locale: 'fr' },
        result : {
            allResourceCategories: { 
                nodes: [
                    { code: 1, name: 'cat1' },
                    { code: 2, name: 'cat2' }
                ]
            }
        }
    }
  ]), appContextDecorator({ i18n: { lang: 'fr', translator: val => (val as string) }, 
    categories: initial(true, []),
    version: '0_9',
    loading: false,
    token: 'token',
    unreadConversations: [], unreadNotifications: []
  })]
} satisfies Meta<typeof CategoriesSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    onSelectionChanged: console.log,
    values: []
  }
}

export const SomeSelected: Story = {
  args: {
    onSelectionChanged: console.log,
    values: [1, 2]
  }
}
