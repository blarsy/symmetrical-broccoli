import { Meta, StoryObj } from "@storybook/react/*"
import { clientComponentDecorator } from "@/lib/storiesUtil"
import ResourceAttributesFilter from "./ResourceAttributesFilter"

const meta = {
    component: ResourceAttributesFilter,
    parameters: {
      // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
      layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {

    },
    args: {  },
    decorators: [clientComponentDecorator(), ]
  } satisfies Meta<typeof ResourceAttributesFilter>
  
  export default meta
  type Story = StoryObj<typeof meta>
  
  export const Empty: Story = {
    args: {
        searchParameters: {
            canBeDelivered: true, canBeExchanged: true, canBeGifted: true, canBeTakenAway: true, isProduct: true, isService: true,
            distanceToReferenceLocation: 5, categoryCodes: [], excludeUnlocated: false, referenceLocation: { address: 'add', latitude: 2, longitude: 50 },
            searchTerm: '', inCurrentCampaign: false
        }, onChange: console.log
    }
  }