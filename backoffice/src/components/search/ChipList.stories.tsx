import { Meta, StoryObj } from "@storybook/nextjs-vite"
import { clientComponentDecorator } from "@/lib/storiesUtil"
import { ToggledChipList } from "./ChipList"

const meta = {
    component: ToggledChipList,
    parameters: {
      // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
      layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {

    },
    args: {  },
    decorators: [clientComponentDecorator(), ]
  } satisfies Meta<typeof ToggledChipList>
  
  export default meta
  type Story = StoryObj<typeof meta>
  
  export const Empty: Story = {
    args: {
        options: {
            option1: true,
            option2: false,
            option3: true
        },
        onChange: console.log
    }
  }