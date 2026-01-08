import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { clientComponentDecorator, defaultAccount } from '@/lib/storiesUtil'
import GrantHit, { GET_GRANT_BY_UID, GRANT_HIT } from './GrantHit'
import { v4 } from 'uuid'

const grantId = v4()
const meta = {
  component: GrantHit,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
args: {
    grantId
  },
  decorators: [  ]
} satisfies Meta<typeof GrantHit>

export default meta
type Story = StoryObj<typeof meta>

const defaultGrantResponse = {
    getGrantByUid: {
        amount: 3000,
        description: 'A bonus for all who participated in the pionneers #2 campaign',
        title: 'Initial grant',
        expiration: new Date(new Date().valueOf() + 1000 * 60 * 60 * 24 * 10)
    }
}
const defaultAppContext = { account: defaultAccount, token: 'flksej', unreadNotifications: [], loading: false, subscriptions: [] }

export const Success: Story = {
  decorators: [clientComponentDecorator(defaultAppContext, undefined, undefined, [{
    query: GET_GRANT_BY_UID, result: defaultGrantResponse, variables: { uid: grantId }
  }, {
    query: GRANT_HIT, result: {
        grantHit: { integer: 1 }
    }, variables: { uid: grantId }
  }])]
}

export const NotFound: Story = {
  decorators: [clientComponentDecorator(undefined, undefined, undefined, [{
    query: GET_GRANT_BY_UID, result: { getGrantByUid: null }, variables: { uid: grantId }
  }])]
}

export const ExpiredGrant: Story = {
  decorators: [clientComponentDecorator(defaultAppContext, undefined, undefined, [{
    query: GET_GRANT_BY_UID, result: defaultGrantResponse, variables: { uid: grantId }
  }, {
    query: GRANT_HIT, result: {
        grantHit: { integer: -1 }
    }, variables: { uid: grantId }
  }])]
}

export const MaxNumberOfGrant: Story = {
  decorators: [clientComponentDecorator(defaultAppContext, undefined, undefined, [{
    query: GET_GRANT_BY_UID, result: defaultGrantResponse, variables: { uid: grantId }
  }, {
    query: GRANT_HIT, result: {
        grantHit: { integer: -2 }
    }, variables: { uid: grantId }
  }])]
}

export const NotOnWhileListGrant: Story = {
  decorators: [clientComponentDecorator(defaultAppContext, undefined, undefined, [{
    query: GET_GRANT_BY_UID, result: defaultGrantResponse, variables: { uid: grantId }
  }, {
    query: GRANT_HIT, result: {
        grantHit: { integer: -3 }
    }, variables: { uid: grantId }
  }])]
}

export const NotParticipateInCampaignGrant: Story = {
  decorators: [clientComponentDecorator(defaultAppContext, undefined, undefined, [{
    query: GET_GRANT_BY_UID, result: defaultGrantResponse, variables: { uid: grantId }
  }, {
    query: GRANT_HIT, result: {
        grantHit: { integer: -4 }
    }, variables: { uid: grantId }
  }])]
}