import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import LocationSelector from './LocationSelector'
import { uiContextDecorator } from '@/lib/storiesUtil'
import { Stack } from '@mui/material'

const meta = {
  component: LocationSelector,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {  },
  decorators: [uiContextDecorator(), Story => <Stack sx={{ height: '100vh', width: '100vw' }}>
        <Story />
    </Stack>]
} satisfies Meta<typeof LocationSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    onLocationSet: console.log,
    value: null
  }
}

export const Initialized: Story = {
  args: {
    onLocationSet: console.log,
    value: { address: 'somewhere', latitude: 50, longitude: 3 }
  }
}