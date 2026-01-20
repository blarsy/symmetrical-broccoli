import { gql } from "@apollo/client";

export const GET_ACTIVE_CAMPAIGN = gql`query GetActiveCampaign {
  getActiveCampaign {
    airdrop
    airdropAmount
    beginning
    created
    defaultResourceCategories
    summary
    description
    ending
    id
    name
    resourceRewardsMultiplier
    airdropDone
  }
}`