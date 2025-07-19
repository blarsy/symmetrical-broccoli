"use client"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import LoadedZone from "@/components/scaffold/LoadedZone"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { usePagePath } from "@/lib/utils"
import { gql, useLazyQuery } from "@apollo/client"
import { useContext, useEffect, useState } from "react"
import { fromServerGraphResource, Resource } from "@/lib/schema"
import useCategories from "@/lib/useCategories"
import EditResource from "@/components/resources/EditResource"
import { UiContext } from "@/components/scaffold/UiContextProvider"
import { GET_RESOURCE } from "@/lib/apolloClient"
import { AppContext } from "@/components/scaffold/AppContextProvider"
import useProfileAddress from "@/components/user/useProfileAddress"

const Wrapped = (p: { resourceId: number }) => {
    const [resource, setResource] = useState<DataLoadState<Resource | undefined>>(initial(true, undefined))
    const [getResource] = useLazyQuery(GET_RESOURCE)
    const categories = useCategories()
    const uiContext = useContext(UiContext)
    const appContext = useContext(AppContext)
    const { data: address, loading, error } = useProfileAddress()

    const loadResource = async () => {
        try {
            if(p.resourceId != 0 && categories.data) {
                const rawRes = await getResource({ variables: { id: Number(p.resourceId) } })
                setResource(fromData(fromServerGraphResource(rawRes.data.resourceById, categories.data)))
            } else {
                setResource(fromData({
                    specificLocation: address || null, isService: false, isProduct: false, canBeDelivered: false, canBeExchanged: false,
                    canBeGifted: false, canBeTakenAway: false, created: new Date(), deleted: null, subjectiveValue: null,
                    id: 0, images: [], title: '', description: '', categories: []
                }))
            }
        } catch (e) {
            setResource(fromError(e, uiContext.i18n.translator('requestError')))
        }
    }
    useEffect(() => {
        if(categories.data && !error && !loading) loadResource()
    }, [categories.data, address, loading, error])

    return <LoadedZone loading={resource.loading || loading} error={resource.error || error} containerStyle={{ overflow: 'auto', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <EditResource value={resource.data}/>
    </LoadedZone>
}

const Page = () => {
    const { version, param } = usePagePath()

    return <ConnectedLayout version={version} allowAnonymous>
        <Wrapped resourceId={Number(param)} />
    </ConnectedLayout>
}

export default Page