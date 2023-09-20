import { Account, Network } from "@/lib/schema"
import React, { useContext, useState } from "react"
import { ActivityIndicator, IconButton, List, Portal, Snackbar, Text } from "react-native-paper"
import { View } from "react-native"
import LoadedList from "./LoadedList"
import DataLoadState from "@/lib/DataLoadState"
import { acceptInvitation, declineInvitation } from "@/lib/api"
import { AppContext } from "./AppContextProvider"
import { t } from "@/i18n"
import Images from "@/Images"

interface Props {
    state: DataLoadState<Network>,
    onChange: () => Promise<void>
}
interface ReqProps {
    item: Account,
    onChange: () => Promise<void>
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

const RequestsReceived = ({ state, onChange }: Props) => <LoadedList data={state.data!.receivedLinkRequests}
    loading={state.loading} error={state.error}
    displayItem={(item, idx) => <RequestReceived key={idx} item={item} onChange={onChange} />} />

export default RequestsReceived