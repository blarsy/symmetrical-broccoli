import { Meta, StoryObj } from "@storybook/nextjs-vite"
import ProximityFilter from "./ProximityFilter"
import { clientComponentDecorator } from "@/lib/storiesUtil"

const meta = {
    component: ProximityFilter,
    parameters: {
      // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
      layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {

    },
    args: {  },
    decorators: [clientComponentDecorator(), ]
  } satisfies Meta<typeof ProximityFilter>
  
  export default meta
  type Story = StoryObj<typeof meta>
  
  export const Empty: Story = {
    args: {
        value: { distanceToReferenceLocation: 10, excludeUnlocated: false, referenceLocation: null },
        onChange: console.log
    }
  }