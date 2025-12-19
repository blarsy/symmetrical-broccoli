import type { Meta, StoryObj } from '@storybook/react'

import ExplainToken from './ExplainToken'
import { useState } from 'react'
import { Button } from '@mui/material'
import { clientComponentDecorator } from '@/lib/storiesUtil'

const meta = {
  component: ExplainToken,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {  },
  decorators: [clientComponentDecorator(), (Story, context) => {
    const [showing, setShowing] = useState(false)

    return <>
        <Button onClick={() => setShowing(true)}>Montrer</Button>
        <Story args={{ ...context.args, visible: showing, onClose: () => setShowing(false) }}/>
    </>
  }]
} satisfies Meta<typeof ExplainToken>

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = {
  args: { visible: true, onClose: console.log }
}
