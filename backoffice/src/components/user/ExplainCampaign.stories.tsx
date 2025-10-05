import type { Meta, StoryObj } from '@storybook/react'
import ExplainCampaign from './ExplainCampaign'
import { useState } from 'react'
import { Button } from '@mui/material'
import { apolloClientMocksDecorator, clientComponentDecorator, defaultCampaign } from '@/lib/storiesUtil'
import { GET_ACTIVE_CAMPAIGN } from '@/lib/useActiveCampaign'

const meta = {
  component: ExplainCampaign,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {  },
  decorators: [apolloClientMocksDecorator([
    { query: GET_ACTIVE_CAMPAIGN, result: {
        getActiveCampaign: defaultCampaign }, variables: {} }
  ]), clientComponentDecorator(), (Story) => {
    const [showing, setShowing] = useState(false)

    return <>
        <Button onClick={() => setShowing(true)}>Montrer</Button>
        <Story args={{ visible: showing, onClose: () => setShowing(false) }}/>
    </>
  }]
} satisfies Meta<typeof ExplainCampaign>

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = { args: { visible: false, onClose: console.log } }
