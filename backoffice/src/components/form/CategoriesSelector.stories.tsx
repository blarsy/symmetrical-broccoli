import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import CategoriesSelector from './CategoriesSelector'
import { apolloClientMocksDecorator, clientComponentDecorator } from '@/lib/storiesUtil'
import { GET_CATEGORIES } from '@/lib/useCategories'

const meta = {
  component: CategoriesSelector,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    nextjs: {
      appDirectory: true,
    },
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {},
  decorators: [ clientComponentDecorator(undefined, undefined, undefined, undefined, [
                    { code: 1, name: 'cat1' },
                    { code: 2, name: 'cat2' }
                ])]
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
