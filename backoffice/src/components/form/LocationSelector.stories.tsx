import type { Meta, StoryObj } from '@storybook/react'
import LocationSelector from './LocationSelector'
import { appContextDecorator } from '@/lib/storiesUtil'
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
  decorators: [appContextDecorator(), Story => <Stack sx={{ height: '100vh', width: '100vw' }}>
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
