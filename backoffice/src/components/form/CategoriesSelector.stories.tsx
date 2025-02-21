import type { Meta, StoryObj } from '@storybook/react'
import CategoriesSelector, { GET_CATEGORIES } from './CategoriesSelector'
import { apolloClientMocksDecorator } from '@/lib/storiesUtil'

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
  ])]
} satisfies Meta<typeof CategoriesSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    lang: 'fr',
    onSelectionChanged: console.log,
    values: []
  }
}

export const SomeSelected: Story = {
  args: {
    lang: 'fr',
    onSelectionChanged: console.log,
    values: [1, 2]
  }
}
