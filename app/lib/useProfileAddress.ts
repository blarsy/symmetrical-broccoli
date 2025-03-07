import { AppContext, AppDispatchContext, AppReducerActionType } from "@/components/AppContextProvider"
import { useContext, useEffect, useState } from "react"
import { Location, parseLocationFromGraph } from "./schema"
import { fromData, fromError, initial } from "./DataLoadState"
import { gql, useLazyQuery } from "@apollo/client"

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
    const appDispatch = useContext(AppDispatchContext)
    const [getLocation] = useLazyQuery(ACCOUNT_LOCATION)
    const [state, setState] = useState(initial(true, null as Location | null))

    const loadLocationAndReset = async () => {
        try {
            const res = await getLocation({ variables: { id: appContext.account!.id }, fetchPolicy: "network-only" })
            const defaultLocation = parseLocationFromGraph(res.data.accountById.locationByLocationId)

            setState(fromData(defaultLocation))
        } catch(e) {
            setState(fromError(e))
            appDispatch({ type: AppReducerActionType.DisplayNotification,  payload: { error: e }})
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

