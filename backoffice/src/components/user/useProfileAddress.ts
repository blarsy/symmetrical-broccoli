import { useContext, useEffect, useState } from "react"
import { gql, useLazyQuery } from "@apollo/client"
import { AppContext } from "../scaffold/AppContextProvider"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { parseLocationFromGraph, Location } from "@/lib/schema"
import { UiContext } from "../scaffold/UiContextProvider"
import { error } from "@/lib/logger"

export const ACCOUNT_LOCATION = gql`query AccountLocation {
    me {
      id
      locationByLocationId {
        address
        latitude
        longitude
        id
      }
    }
}`

export default () => {
    const appContext = useContext(AppContext)
    const uiContext = useContext(UiContext)
    const [getLocation] = useLazyQuery(ACCOUNT_LOCATION, {  fetchPolicy: "network-only" })
    const [state, setState] = useState(initial(true, null as Location | null))

    const loadLocationAndReset = async () => {
        try {
            const res = await getLocation()
            const defaultLocation = parseLocationFromGraph(res.data.me.locationByLocationId)

            setState(fromData(defaultLocation))
        } catch(e) {
            error({
                message: (e as Error).toString(), accountId: appContext.account?.id
            }, uiContext.version, true)
            setState(fromError(e, uiContext.i18n.translator('requestError')))
        }
    }

    useEffect(() => {
        if(appContext.account) {
            loadLocationAndReset()
        } else {
            setState(fromData(null))
        }
    }, [])

    return state
}