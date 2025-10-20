import { AppAlertDispatchContext, AppAlertReducerActionType, AppContext, AppDispatchContext, AppReducerActionType } from "@/components/AppContextProvider"
import { useContext, useEffect, useState } from "react"
import { Location, parseLocationFromGraph } from "./schema"
import { fromData, fromError, initial } from "./DataLoadState"
import { gql, useLazyQuery } from "@apollo/client"

export const ACCOUNT_LOCATION = gql`query AccountLocation($id: Int!) {
    getAccountPublicInfo(id: $id) {
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
    const appAlertDispatch = useContext(AppAlertDispatchContext)
    const [getLocation] = useLazyQuery(ACCOUNT_LOCATION)
    const [state, setState] = useState(initial(true, null as Location | null))

    const loadLocationAndReset = async () => {
        try {
            const res = await getLocation({ variables: { id: appContext.account!.id }, fetchPolicy: "network-only" })
            const defaultLocation = parseLocationFromGraph(res.data.getAccountPublicInfo.locationByLocationId)

            setState(fromData(defaultLocation))
        } catch(e) {
            setState(fromError(e))
            appAlertDispatch({ type: AppAlertReducerActionType.DisplayNotification,  payload: { error: e as Error }})
        }
    }

    useEffect(() => {
        if(appContext.account) {
            loadLocationAndReset()
        } else {
            setState(fromData(null))
        }
    }, [])

    //console.log('useProfileAddress state', state)
    return state
}

