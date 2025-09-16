import { gql, useLazyQuery } from "@apollo/client"
import { useEffect, useState } from "react"
import DataLoadState, { fromData, fromError, initial } from "./DataLoadState"
import { t } from "@/i18n"


const GET_ACTIVE_CAMPAIGN = gql`query GetActiveCampaign {
  getActiveCampaign {
    airdrop
    airdropAmount
    beginning
    created
    defaultResourceCategories
    description
    ending
    id
    name
    resourceRewardsMultiplier
  }
}`

export interface Campaign {
    id: number
    name: string
    description: string
    airdrop: Date
    airdropAmount: number
    beginning: Date
    ending: Date
    defaultResourceCategories: number[]
    resourceRewardsMultiplier: number
}

function useActiveCampaign () {
    const [getActiveCampaign] = useLazyQuery(GET_ACTIVE_CAMPAIGN)
    const [activeCampaign, setActiveCampaign] = useState<DataLoadState<Campaign | undefined>>(initial(true, undefined))

    const load = async () => {
        try {
            const res = await getActiveCampaign({ variables: {} })
            setActiveCampaign(fromData({ 
                id: res.data.getActiveCampaign.id,
                name: res.data.getActiveCampaign.name, description: res.data.getActiveCampaign.description, airdrop: res.data.getActiveCampaign.airdrop,
                airdropAmount: res.data.getActiveCampaign.airdropAmount, resourceRewardsMultiplier: res.data.getActiveCampaign.resourceRewardsMultiplier,
                beginning: res.data.getActiveCampaign.beginning, ending: res.data.getActiveCampaign.ending, 
                defaultResourceCategories: res.data.getActiveCampaign.defaultResourceCategories
             }))
        } catch(e) {
            setActiveCampaign(fromError(e, t('requestError')))
        }
    }

    useEffect(() => {
        load()
    }, [])

    return { load, activeCampaign }
}

export default useActiveCampaign