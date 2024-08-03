import { RouteProps } from "@/lib/utils"
import Account from "../account/Account"
import React, { useContext } from "react"
import { AppContext } from "../AppContextProvider"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"

export default ({ route, navigation }: RouteProps) => {
    const appContext = useContext(AppContext)
    const { ensureConnected} = useUserConnectionFunctions()
    return <Account id={route.params!.id} viewResourceRequested={resource => navigation.navigate('viewResource', { resourceId: resource.id }) }
        chatOpenRequested={resource => {
        ensureConnected('introduce_yourself', '', () => {
            setTimeout(() => navigation.navigate('chat', {
                    screen: 'conversation',
                    params: {
                        resourceId: resource.id,
                        otherAccountId: resource.account!.id
                    }
                })
            )
        })
    } } />
}