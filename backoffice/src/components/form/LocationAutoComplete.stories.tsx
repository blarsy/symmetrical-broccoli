import type { Meta, StoryObj } from '@storybook/react'
import LocationAutoComplete from './LocationAutoComplete'
import { appContextDecorator, MapsProviderDecorator } from '@/lib/storiesUtil'

const meta = {
  component: LocationAutoComplete,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  decorators: [ appContextDecorator(), MapsProviderDecorator ]
} satisfies Meta<typeof LocationAutoComplete>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    onChange: console.log,
    style: { width: 400 }
  }
}

export const Initialized: Story = {
    args: {
        onChange: console.log,
        value: { address: 'somewhere', latitude: 50, longitude: 3 },
        style: { width: 400 }
    }
}
