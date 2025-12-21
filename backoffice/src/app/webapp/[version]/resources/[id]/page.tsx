"use client"
import ConnectedLayout from "@/components/scaffold/ConnectedLayout"
import LoadedZone from "@/components/scaffold/LoadedZone"
import DataLoadState, { fromData, fromError, initial } from "@/lib/DataLoadState"
import { usePagePath } from "@/lib/usePagePath"
import { useLazyQuery } from "@apollo/client"
import { useContext, useEffect, useState } from "react"
import { fromServerGraphResource, Resource } from "@/lib/schema"
import EditResource from "@/components/resources/EditResource"
import { UiContext } from "@/components/scaffold/UiContextProvider"
import { GET_RESOURCE } from "@/lib/apolloClient"
import useProfileAddress from "@/components/user/useProfileAddress"
import { AppContext } from "@/components/scaffold/AppContextProvider"
import useActiveCampaign from "@/lib/useActiveCampaign"

const Wrapped = (p: { resourceId: number, inCampaign: boolean }) => {
    const [resource, setResource] = useState<DataLoadState<Resource | undefined>>(initial(true, undefined))
    const appContext = useContext(AppContext)
    const [getResource] = useLazyQuery(GET_RESOURCE)
    const uiContext = useContext(UiContext)
    const { data: address, loading, error } = useProfileAddress()
    const { activeCampaign } = useActiveCampaign()

    const loadResource = async () => {
        try {
            if(p.resourceId != 0 && uiContext.categories.data) {
                const rawRes = await getResource({ variables: { id: Number(p.resourceId) } })
                if(rawRes.data.resourceById.accountByAccountId.id != appContext.account!.id) {
                    throw new Error('This resource cannot be edited')
                }
                setResource(fromData(fromServerGraphResource(rawRes.data.resourceById, uiContext.categories.data, activeCampaign.data?.id)))
            } else {
                setResource(fromData({
                    specificLocation: address || null, isService: false, isProduct: false, canBeDelivered: false, canBeExchanged: false,
                    canBeGifted: false, canBeTakenAway: false, created: new Date(), deleted: null, price: null,
                    id: 0, images: [], title: '', description: '', categories: [], inActiveCampaign: p.inCampaign
                }))
            }
        } catch (e) {
            setResource(fromError(e, uiContext.i18n.translator('requestError')))
        }
    }
    useEffect(() => {
        if(uiContext.categories.data && !error && !loading && !activeCampaign.loading && !activeCampaign.error) loadResource()
    }, [uiContext.categories.data, address, loading, error, activeCampaign])

    return <LoadedZone loading={resource.loading || loading} error={resource.error || error} containerStyle={{ overflow: 'auto', alignItems: 'center', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <EditResource value={resource.data}/>
    </LoadedZone>
}

const Page = () => {
    const { version, param, query } = usePagePath()

    return <ConnectedLayout version={version}>
        <Wrapped resourceId={Number(param)} inCampaign={ !!query?.get('campaign') } />
    </ConnectedLayout>
}

export default Page