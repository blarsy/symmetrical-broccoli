import { Meta, StoryObj } from "@storybook/react/*"
import SearchFilter from "./SearchFilter"
import ClientWrapper from "../scaffold/ClientWrapper"
import { apolloClientMocksDecorator } from "@/lib/storiesUtil"
import { DEFAULT_SEARCH_PARAMETERS } from "./Search"
import { GET_CATEGORIES } from "@/lib/useCategories"

const meta = {
    title: 'Search filter',
    component: SearchFilter,
    parameters: {
      // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
      layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {

    },
    args: {  },
    decorators: [apolloClientMocksDecorator([{
        query: GET_CATEGORIES,
        variables: { locale: 'fr' },
        result : {
            allResourceCategories: { 
                nodes: [
                    { code: 1, name: 'cat1' },
                    { code: 2, name: 'cat2' }
                ]
            }
        }
    }]), (Story) => <ClientWrapper version="v0_9">
    <Story/>
  </ClientWrapper>]
  } satisfies Meta<typeof SearchFilter>
  
  export default meta
  type Story = StoryObj<typeof meta>
  
  export const Empty: Story = {
    args: {
      value: DEFAULT_SEARCH_PARAMETERS,
      onParamsChanged: console.log
    }
  }