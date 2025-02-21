import { Meta, StoryObj } from "@storybook/react/*"
import ClientWrapper from "../scaffold/ClientWrapper"
import ProximityFilter from "./ProximityFilter"

const meta = {
    title: 'Search filter, proximity',
    component: ProximityFilter,
    parameters: {
      // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
      layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {

    },
    args: {  },
    decorators: [ (Story) => <ClientWrapper version="">
        <Story/>
    </ClientWrapper>]
  } satisfies Meta<typeof ProximityFilter>
  
  export default meta
  type Story = StoryObj<typeof meta>
  
  export const Empty: Story = {
    args: {
        value: { distanceToReferenceLocation: 10, excludeUnlocated: false, referenceLocation: null },
        onChange: console.log
    }
  }