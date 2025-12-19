import type { Meta, StoryObj } from '@storybook/react'
import Resources, { RESOURCES } from './Resources'
import { apolloClientMocksDecorator, configDayjsDecorator, clientComponentDecorator, makeDbRresource, defaultCampaign } from '@/lib/storiesUtil'
import { GET_ACTIVE_CAMPAIGN } from '@/lib/queries'

const meta = {
  component: Resources,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
  decorators: [ clientComponentDecorator(), configDayjsDecorator ]
} satisfies Meta<typeof Resources>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  args: {
    onChange: console.log,
  },
  decorators: [apolloClientMocksDecorator([
    { query: RESOURCES, result: { myResources: { nodes: [] } }, variables: {} },
    { query: GET_ACTIVE_CAMPAIGN, result: { getActiveCampaign: null}, variables: {} }
  ])]
}

export const Initialized: Story = {
  args: {
    onChange: console.log,
  },
  decorators: [apolloClientMocksDecorator([
    { query: RESOURCES, result: { myResources: { nodes: [
        makeDbRresource('Resource active avec images', 
            'Une très longue description. Pour tester comment un champ gère correctement une chaîne de caractère de grande longueur, rien de tel que de lui en donner une interminable.', 
            null, 'Les patines de Christine', 
            ["q5owgl7lz6x7vmai9ctz", "ltnozwdpaqyazpkk0out", "uojh5axy7ggnenhypj9f", "sboopci7bbre34jezxu8"]),
        makeDbRresource('Resource active sans image, expire demain', 
            'description courte',
            null , 'Les patines de Christine', 
            [], new Date(new Date().valueOf() + 1000 * 60 * 60 * 24)),
        makeDbRresource('Resource supprimée, 1 image', 
            'description courte', 
            new Date(new Date().valueOf() - 100000), 'Les patines de Christine', 
            ["itqjuvh6gntgzk7mjmwu"]),
        
        ] } }, variables: {} },
    { query: GET_ACTIVE_CAMPAIGN, result: { getActiveCampaign: null}, variables: {} },
  ])]
}

export const WithActiveCampaign: Story = {
  args: {
    onChange: console.log,
  },
  decorators: [apolloClientMocksDecorator([
    { query: RESOURCES, result: { myResources: { nodes: [
        makeDbRresource('Resource active avec images', 
            'Une très longue description. Pour tester comment un champ gère correctement une chaîne de caractère de grande longueur, rien de tel que de lui en donner une interminable.', 
            null, 'Les patines de Christine', 
            ["q5owgl7lz6x7vmai9ctz", "ltnozwdpaqyazpkk0out", "uojh5axy7ggnenhypj9f", "sboopci7bbre34jezxu8"]),
        makeDbRresource('Resource active sans image, expire demain', 
            'description courte',
            null , 'Les patines de Christine', 
            [], new Date(new Date().valueOf() + 1000 * 60 * 60 * 24)),
        makeDbRresource('Resource supprimée, 1 image', 
            'description courte', 
            new Date(new Date().valueOf() - 100000), 'Les patines de Christine', 
            ["itqjuvh6gntgzk7mjmwu"]),
        ] } }, variables: {} },
    { query: GET_ACTIVE_CAMPAIGN, result: { getActiveCampaign: defaultCampaign}, variables: {} }
  ])]
}