import { Account, Network } from "@/lib/schema"
import React, { useContext, useState } from "react"
import { ActivityIndicator, IconButton, List } from "react-native-paper"
import { View } from "react-native"
import LoadedList from "./LoadedList"
import DataLoadState from "@/lib/DataLoadState"
import { acceptInvitation, declineInvitation } from "@/lib/api"
import { AppContext } from "./AppContextProvider"
import { t } from "@/i18n"
import Images from "@/Images"
import { RouteProps } from "@/lib/utils"

interface ReqProps {
    item: Account,
    onChange: () => void
}

const RequestReceived = ({ item, onChange }: ReqProps) => {
    const appContext = useContext(AppContext)
    const [opProcessing, setOpProcessing] = useState(false)
    return <List.Item title={item.name} description={item.email} right={() => <View style={{ flexDirection: 'row' }}>
        { opProcessing && <ActivityIndicator /> }
        <IconButton icon={Images.Valid} size={20} onPress={async () => {
            try {
                setOpProcessing(true)
                await acceptInvitation(item.id, appContext.state.token.data!)
                appContext.actions.notify(t('invitationAccepted_Message', { name: item.name }))
                onChange()
            } catch(e) {
                appContext.actions.notify(t('requestError'))
            } finally {
                setOpProcessing(false)
            }
        }} />
        <IconButton icon={Images.Cross} size={20} onPress={async () => {
            try {
                setOpProcessing(true)
                await declineInvitation(item.id, appContext.state.token.data!)
                appContext.actions.notify(t('invitationDeclined_Message', { name: item.name }))
                onChange()
            } catch(e) {
                appContext.actions.notify(t('requestError'))
            } finally {
                setOpProcessing(false)
            }
        }} />
    </View>} />
}

const RequestsReceived = ({ route, navigation }: RouteProps) => <LoadedList data={(route.params.network as DataLoadState<Network>).data!.receivedLinkRequests}
    loading={route.params.network.loading} error={route.params.network.error}
    displayItem={(item, idx) => <RequestReceived key={idx} item={item} onChange={() => navigation.navigate({
        name: 'networkMain',
        params: { hasChanged: true },
        merge: true
    })} />} />

export default RequestsReceived