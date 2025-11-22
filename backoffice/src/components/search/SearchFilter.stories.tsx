import { Meta, StoryObj } from "@storybook/react/*"
import SearchFilter from "./SearchFilter"
import { apolloClientMocksDecorator, clientComponentDecorator } from "@/lib/storiesUtil"
import { DEFAULT_SEARCH_PARAMETERS } from "./Search"
import { GET_CATEGORIES } from "@/lib/useCategories"
import { GET_ACTIVE_CAMPAIGN } from "@/lib/useActiveCampaign"
import { fromToday } from "@/utils"

const meta = {
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
    }]), clientComponentDecorator(), ]
  } satisfies Meta<typeof SearchFilter>
  
  export default meta
  type Story = StoryObj<typeof meta>
  
  export const Empty: Story = {
    args: {
      value: DEFAULT_SEARCH_PARAMETERS,
      onParamsChanged: console.log
    }
  }

  export const WithCampaign: Story = {
    args: {
      value: DEFAULT_SEARCH_PARAMETERS,
      onParamsChanged: console.log,
    },
    decorators: [ apolloClientMocksDecorator([{
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
    },{
        query: GET_ACTIVE_CAMPAIGN,
        variables: {  },
        result : {
            getActiveCampaign: {
              airdrop: fromToday(10),
              airdropAmount: 3000,
              beginning: fromToday(1),
              created: new Date(),
              defaultResourceCategories: [],
              description: 'campaing fake desc',
              ending: fromToday(20),
              id: 1,
              name: 'Vive la rentrée!',
              resourceRewardsMultiplier: 5,
              airdropDone: false
            }
          }
        }
    ])]
  }