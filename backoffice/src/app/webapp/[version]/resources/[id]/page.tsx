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
import { error } from "@/lib/logger"

const Wrapped = (p: { resourceId?: string, inCampaign: boolean }) => {
    const [resource, setResource] = useState<DataLoadState<Resource | undefined>>(initial(true, undefined))
    const appContext = useContext(AppContext)
    const [getResource] = useLazyQuery(GET_RESOURCE)
    const uiContext = useContext(UiContext)
    const { data: address, loading, error: profileError } = useProfileAddress()
    const { activeCampaign } = useActiveCampaign()

    const loadResource = async () => {
        try {
            if(p.resourceId && uiContext.categories.data) {
                const rawRes = await getResource({ variables: { id: p.resourceId } })
                if(rawRes.data.resourceById.accountsPublicDatumByAccountId.id != appContext.account!.id) {
                    throw new Error('This resource cannot be edited')
                }
                setResource(fromData(fromServerGraphResource(rawRes.data.resourceById, uiContext.categories.data, activeCampaign.data?.id)))
            } else {
                setResource(fromData({
                    specificLocation: address || null, isService: false, isProduct: false, canBeDelivered: false, canBeExchanged: false,
                    canBeGifted: false, canBeTakenAway: false, created: new Date(), deleted: null, price: null,
                    id: '', images: [], title: '', description: '', categories: [], inActiveCampaign: p.inCampaign
                }))
            }
        } catch (e) {
            error({ message: (e as Error).toString(), accountId: appContext.account?.id }, uiContext.version, true)
            setResource(fromError(e, uiContext.i18n.translator('requestError')))
        }
    }
    useEffect(() => {
        if(uiContext.categories.data && !profileError && !loading && !activeCampaign.loading && !activeCampaign.error) loadResource()
    }, [uiContext.categories.data, address, loading, profileError, activeCampaign])

    return <LoadedZone loading={resource.loading || loading} error={resource.error || profileError} containerStyle={{ overflow: 'auto', alignItems: 'center', paddingLeft: '2rem', paddingRight: '2rem' }}>
        <EditResource value={resource.data}/>
    </LoadedZone>
}

const Page = () => {
    const { version, param, query } = usePagePath()

    return <ConnectedLayout version={version}>
        <Wrapped resourceId={param === 'new' ? undefined : param} inCampaign={ !!query?.get('campaign') } />
    </ConnectedLayout>
}

export default Page