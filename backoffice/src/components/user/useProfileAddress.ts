import { useContext, useEffect, useState } from "react"
import { gql, useLazyQuery } from "@apollo/client"
import { AppContext } from "../scaffold/AppContextProvider"
import { fromData, fromError, initial } from "@/lib/DataLoadState"
import { parseLocationFromGraph, Location } from "@/lib/schema"

export const ACCOUNT_LOCATION = gql`query AccountLocation($id: Int!) {
    accountById(id: $id) {
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
    const [getLocation] = useLazyQuery(ACCOUNT_LOCATION)
    const [state, setState] = useState(initial(true, null as Location | null))

    const loadLocationAndReset = async () => {
        try {
            const res = await getLocation({ variables: { id: appContext.account!.id }, fetchPolicy: "network-only" })
            const defaultLocation = parseLocationFromGraph(res.data.accountById.locationByLocationId)

            setState(fromData(defaultLocation))
        } catch(e) {
            setState(fromError(e, appContext.i18n.translator('requestError')))
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