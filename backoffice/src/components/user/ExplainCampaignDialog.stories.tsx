import type { Meta, StoryObj } from '@storybook/react'
import ExplainCampaignDialog from './ExplainCampaignDialog'
import { useState } from 'react'
import { Button } from '@mui/material'
import { apolloClientMocksDecorator, clientComponentDecorator, defaultCampaign } from '@/lib/storiesUtil'
import { fromToday } from '@/utils'
import { GET_ACTIVE_CAMPAIGN } from '@/lib/queries'

const meta = {
  component: ExplainCampaignDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {  },
  decorators: [clientComponentDecorator(), (Story) => {
    const [showing, setShowing] = useState(false)

    return <>
        <Button onClick={() => setShowing(true)}>Montrer</Button>
        <Story args={{ visible: showing, onClose: () => setShowing(false) }}/>
    </>
  }]
} satisfies Meta<typeof ExplainCampaignDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = { 
  args: { visible: false, onClose: console.log },
  decorators: [apolloClientMocksDecorator([
    { query: GET_ACTIVE_CAMPAIGN, result: {
        getActiveCampaign: defaultCampaign }, variables: {} }
  ])]
}

export const AirdropPassed: Story = { 
  args: { visible: false, onClose: console.log },
  decorators: [apolloClientMocksDecorator([
    { query: GET_ACTIVE_CAMPAIGN, result: {
        getActiveCampaign: { ...defaultCampaign, ...{ airdrop: fromToday(-2) } } }, variables: {} }
  ])]
}
