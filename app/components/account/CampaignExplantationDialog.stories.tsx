import type { Meta, StoryObj } from '@storybook/react';
import CampaignExplanationDialog from './CampaignExplanationDialog'
import { apolloClientMocksDecorator, appContextDecorator, defaultCampaign, fromToday, paperProviderDecorator } from '@/lib/storiesUtil'


const meta = {
  component: CampaignExplanationDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  args: {  },
  decorators: [paperProviderDecorator, appContextDecorator(false, false, false, 45), apolloClientMocksDecorator([])]
} satisfies Meta<typeof CampaignExplanationDialog>

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = { 
  args: { campaign: defaultCampaign, onDismiss: console.log },
}

export const AirdropPassed: Story = { 
  args: { campaign: { ...defaultCampaign, ...{ airdrop: fromToday(-2) } }, onDismiss: console.log },
}
