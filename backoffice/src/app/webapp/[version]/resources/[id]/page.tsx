"use client"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import LoadedZone from "@/components/scaffold/LoadedZone"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { usePagePath } from "@/lib/utils"
import { useLazyQuery } from "@apollo/client"
import { useContext, useEffect, useState } from "react"
import { fromServerGraphResource, Resource } from "@/lib/schema"
import useCategories from "@/lib/useCategories"
import EditResource from "@/components/resources/EditResource"
import { UiContext } from "@/components/scaffold/UiContextProvider"
import { GET_RESOURCE } from "@/lib/apolloClient"
import useProfileAddress from "@/components/user/useProfileAddress"
import { AppContext } from "@/components/scaffold/AppContextProvider"

const Wrapped = (p: { resourceId: number }) => {
    const [resource, setResource] = useState<DataLoadState<Resource | undefined>>(initial(true, undefined))
    const appContext = useContext(AppContext)
    const [getResource] = useLazyQuery(GET_RESOURCE)
    const categories = useCategories()
    const uiContext = useContext(UiContext)
    const { data: address, loading, error } = useProfileAddress()

    const loadResource = async () => {
        try {
            if(p.resourceId != 0 && categories.data) {
                const rawRes = await getResource({ variables: { id: Number(p.resourceId) } })
                if(rawRes.data.resourceById.accountByAccountId.id != appContext.account!.id) {
                    throw new Error('This resource cannot be edited')
                }
                setResource(fromData(fromServerGraphResource(rawRes.data.resourceById, categories.data)))
            } else {
                setResource(fromData({
                    specificLocation: address || null, isService: false, isProduct: false, canBeDelivered: false, canBeExchanged: false,
                    canBeGifted: false, canBeTakenAway: false, created: new Date(), deleted: null, price: null,
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

    return <ConnectedLayout version={version}>
        <Wrapped resourceId={Number(param)} />
    </ConnectedLayout>
}

export default Page