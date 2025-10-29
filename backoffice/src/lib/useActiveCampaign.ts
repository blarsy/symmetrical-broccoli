import { gql, useLazyQuery } from "@apollo/client"
import { useContext, useEffect, useState } from "react"
import DataLoadState, { fromData, fromError, initial } from "./DataLoadState"
import { UiContext } from "@/components/scaffold/UiContextProvider"

export const GET_ACTIVE_CAMPAIGN = gql`query GetActiveCampaign {
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
    airdropDone
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
    airdropDone: boolean
}

function useActiveCampaign () {
    const uiContext = useContext(UiContext)
    const [getActiveCampaign] = useLazyQuery(GET_ACTIVE_CAMPAIGN)
    const [activeCampaign, setActiveCampaign] = useState<DataLoadState<Campaign | undefined>>(initial(true, undefined))

    const load = async () => {
        try {
            const res = await getActiveCampaign({ variables: {} })
            //console.log('res', res.data)
            if(res.data.getActiveCampaign === null) {
                setActiveCampaign(fromData(undefined))
            } else {
                setActiveCampaign(fromData({ 
                    id: res.data.getActiveCampaign.id,
                    name: res.data.getActiveCampaign.name, description: res.data.getActiveCampaign.description, airdrop: res.data.getActiveCampaign.airdrop,
                    airdropAmount: res.data.getActiveCampaign.airdropAmount, resourceRewardsMultiplier: res.data.getActiveCampaign.resourceRewardsMultiplier,
                    beginning: res.data.getActiveCampaign.beginning, ending: res.data.getActiveCampaign.ending, 
                    defaultResourceCategories: res.data.getActiveCampaign.defaultResourceCategories,
                    airdropDone: res.data.getActiveCampaign.airdropDone
                 }))
            }
        } catch(e) {
            setActiveCampaign(fromError(e, uiContext.i18n.translator('requestError')))
        }
    }

    useEffect(() => {
        load()
    }, [])

    return { load, activeCampaign }
}

export default useActiveCampaign