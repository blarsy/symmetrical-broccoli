import { RouteProps } from "@/lib/utils"
import Account from "../account/Account"
import React from "react"
import useUserConnectionFunctions from "@/lib/useUserConnectionFunctions"

export default ({ route, navigation }: RouteProps) => {
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